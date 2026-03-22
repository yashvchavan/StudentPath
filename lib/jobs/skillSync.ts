/**
 * Skill Sync Job — lib/jobs/skillSync.ts
 *
 * Monthly background job that refreshes every active student's skill profile.
 *
 * Pipeline per student:
 *  1. Fetch GitHub repositories + README → OpenAI extracts skill profile
 *  2. Fetch LeetCode stats + tags        → infer DSA skill level
 *  3. Fetch latest resume parsed_text    → OpenAI extracts resume skills
 *  4. Merge all three sources            → mergeAllSources()
 *  5. Upsert into student_skills table + update Students.technical_skills
 *  6. Write a run log record to skill_sync_logs table
 *
 * Designed to be called from the Vercel Cron API route:
 *   POST /api/jobs/skill-sync
 *   Schedule: "0 2 1 * *"  (01:00 UTC on the 1st of every month)
 *
 * Concurrency: BATCH_SIZE students are processed in parallel.
 * Any single-student failure is logged but does not abort the whole run.
 */

import pool from "@/lib/db";
import { analyzeGitHubProfile }   from "@/lib/integrations/githubAnalyzer";
import { analyzeLeetCodeProfile }  from "@/lib/integrations/leetcodeAnalyzer";
import { extractSkillsFromResume } from "@/lib/resume/skillExtractor";
import { mergeAllSources }         from "@/lib/skill-engine/mergeSkills";
import { upsertStudentSkills }     from "@/lib/skill-engine/studentSkillsDb";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// ─── Config ───────────────────────────────────────────────────────────────────

/** How many students to process at once (keep low to respect API rate limits) */
const BATCH_SIZE = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentSyncRow extends RowDataPacket {
  student_id:       number;
  github_username:  string | null;
  leetcode_username: string | null;
  resume_text:      string | null;
  email:            string;
  first_name:       string;
  last_name:        string;
}

export interface StudentSyncResult {
  studentId:   number;
  name:        string;
  status:      "success" | "skipped" | "error";
  skillsFound: number;
  sources:     { github: boolean; leetcode: boolean; resume: boolean };
  error?:      string;
  durationMs:  number;
}

export interface SkillSyncRunResult {
  runId:          string;
  startedAt:      string;
  finishedAt:     string;
  totalStudents:  number;
  succeeded:      number;
  skipped:        number;
  failed:         number;
  totalSkillRows: number;
  results:        StudentSyncResult[];
}

// ─── Fetch students ───────────────────────────────────────────────────────────

/**
 * Fetch all active students that have at least one data source configured.
 * Students with no github/leetcode/resume are skipped early.
 */
async function fetchEligibleStudents(): Promise<StudentSyncRow[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<StudentSyncRow[]>(
      `SELECT
         s.student_id,
         s.github_username,
         s.leetcode_username,
         s.email,
         s.first_name,
         s.last_name,
         (
           SELECT r.parsed_text
           FROM   resumes r
           WHERE  r.student_id = s.student_id
             AND  r.parsed_text IS NOT NULL
             AND  r.parsed_text != ''
           ORDER  BY r.created_at DESC
           LIMIT  1
         ) AS resume_text
       FROM Students s
       WHERE s.is_active = TRUE
         AND (
               s.github_username   IS NOT NULL
            OR s.leetcode_username IS NOT NULL
            OR EXISTS (
                 SELECT 1 FROM resumes r2
                 WHERE  r2.student_id = s.student_id
                   AND  r2.parsed_text IS NOT NULL
                   AND  r2.parsed_text != ''
               )
             )
       ORDER BY s.student_id ASC`
    );
    return rows;
  } finally {
    connection.release();
  }
}

// ─── Per-student sync ─────────────────────────────────────────────────────────

/**
 * Run the full skill pipeline for a single student.
 * Returns a result object — never throws.
 */
async function syncStudent(student: StudentSyncRow): Promise<StudentSyncResult> {
  const start = Date.now();
  const name  = `${student.first_name} ${student.last_name}`;

  // Skip if no sources at all (shouldn't happen due to query filter, but guard anyway)
  if (!student.github_username && !student.leetcode_username && !student.resume_text) {
    return {
      studentId:   student.student_id,
      name,
      status:      "skipped",
      skillsFound: 0,
      sources:     { github: false, leetcode: false, resume: false },
      durationMs:  Date.now() - start,
    };
  }

  try {
    // ── Step 1-3: Run analysers concurrently ──────────────────────────────────
    const [ghSettled, lcSettled, resSettled] = await Promise.allSettled([
      student.github_username
        ? analyzeGitHubProfile(student.github_username)
        : Promise.resolve(null),
      student.leetcode_username
        ? analyzeLeetCodeProfile(student.leetcode_username)
        : Promise.resolve(null),
      student.resume_text
        ? extractSkillsFromResume(student.resume_text)
        : Promise.resolve(null),
    ]);

    const gh  = ghSettled.status  === "fulfilled" ? ghSettled.value  : null;
    const lc  = lcSettled.status  === "fulfilled" ? lcSettled.value  : null;
    const res = resSettled.status === "fulfilled" ? resSettled.value : null;

    // Log partial analyser failures (don't abort)
    if (ghSettled.status  === "rejected")
      console.warn(`[SkillSync] GitHub failed for student ${student.student_id}:`,  (ghSettled as PromiseRejectedResult).reason);
    if (lcSettled.status  === "rejected")
      console.warn(`[SkillSync] LeetCode failed for student ${student.student_id}:`, (lcSettled as PromiseRejectedResult).reason);
    if (resSettled.status === "rejected")
      console.warn(`[SkillSync] Resume failed for student ${student.student_id}:`,  (resSettled as PromiseRejectedResult).reason);

    // ── Step 4: Merge ─────────────────────────────────────────────────────────
    const mergeResult = mergeAllSources(
      gh  ? gh.skillProfile : null,
      lc  ? lc.dsaProfile   : null,
      res ?? null
    );

    if (!mergeResult.skills.length) {
      return {
        studentId:   student.student_id,
        name,
        status:      "skipped",
        skillsFound: 0,
        sources:     { github: !!gh, leetcode: !!lc, resume: !!res },
        durationMs:  Date.now() - start,
      };
    }

    // ── Step 5: Upsert into student_skills + sync Students.technical_skills ───
    await upsertStudentSkills(student.student_id, mergeResult);

    return {
      studentId:   student.student_id,
      name,
      status:      "success",
      skillsFound: mergeResult.totalSkills,
      sources:     { github: !!gh, leetcode: !!lc, resume: !!res },
      durationMs:  Date.now() - start,
    };

  } catch (err: any) {
    console.error(`[SkillSync] Fatal error for student ${student.student_id}:`, err);
    return {
      studentId:   student.student_id,
      name,
      status:      "error",
      skillsFound: 0,
      sources:     { github: false, leetcode: false, resume: false },
      error:       err?.message ?? "Unknown error",
      durationMs:  Date.now() - start,
    };
  }
}

// ─── Run log persistence ──────────────────────────────────────────────────────

/**
 * Write a summary row to `skill_sync_logs` after the job completes.
 * Table is created automatically if it doesn't exist (safe for first run).
 */
async function persistRunLog(runResult: SkillSyncRunResult): Promise<void> {
  const connection = await pool.getConnection();
  try {
    // Auto-create the log table on first use (no migration required)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS skill_sync_logs (
        id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
        run_id         VARCHAR(36)  NOT NULL,
        started_at     DATETIME     NOT NULL,
        finished_at    DATETIME     NOT NULL,
        total_students INT          NOT NULL DEFAULT 0,
        succeeded      INT          NOT NULL DEFAULT 0,
        skipped        INT          NOT NULL DEFAULT 0,
        failed         INT          NOT NULL DEFAULT 0,
        total_skills   INT          NOT NULL DEFAULT 0,
        summary_json   JSON,
        PRIMARY KEY (id),
        UNIQUE KEY uq_run_id (run_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute<ResultSetHeader>(
      `INSERT INTO skill_sync_logs
         (run_id, started_at, finished_at, total_students,
          succeeded, skipped, failed, total_skills, summary_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        runResult.runId,
        new Date(runResult.startedAt),
        new Date(runResult.finishedAt),
        runResult.totalStudents,
        runResult.succeeded,
        runResult.skipped,
        runResult.failed,
        runResult.totalSkillRows,
        JSON.stringify(
          // Keep result list lean in the DB — just IDs, statuses, skill counts
          runResult.results.map((r) => ({
            id:     r.studentId,
            name:   r.name,
            status: r.status,
            skills: r.skillsFound,
            ms:     r.durationMs,
            ...(r.error ? { error: r.error } : {}),
          }))
        ),
      ]
    );
  } catch (err) {
    // Log table errors must not fail the whole job
    console.error("[SkillSync] Failed to write run log:", err);
  } finally {
    connection.release();
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Entry point — runs the monthly skill sync for all eligible students.
 *
 * Call from:
 *   POST /api/jobs/skill-sync  (protected by CRON_SECRET)
 *
 * @returns SkillSyncRunResult with full per-student breakdown
 */
export async function runSkillSyncJob(): Promise<SkillSyncRunResult> {
  const runId    = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = new Date().toISOString();

  console.log(`[SkillSync] ========== Job started | runId=${runId} ==========`);

  // ── Fetch eligible students ────────────────────────────────────────────────
  let students: StudentSyncRow[] = [];
  try {
    students = await fetchEligibleStudents();
    console.log(`[SkillSync] ${students.length} eligible student(s) found.`);
  } catch (err) {
    console.error("[SkillSync] Failed to fetch students:", err);
    const finishedAt = new Date().toISOString();
    return {
      runId,
      startedAt,
      finishedAt,
      totalStudents:  0,
      succeeded:      0,
      skipped:        0,
      failed:         0,
      totalSkillRows: 0,
      results:        [],
    };
  }

  // ── Process students in batches ────────────────────────────────────────────
  const results: StudentSyncResult[] = [];

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    console.log(
      `[SkillSync] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/` +
      `${Math.ceil(students.length / BATCH_SIZE)} ` +
      `(students ${i + 1}–${Math.min(i + BATCH_SIZE, students.length)})`
    );

    const batchResults = await Promise.all(batch.map(syncStudent));
    results.push(...batchResults);

    // Small pause between batches to be gentle on external APIs
    if (i + BATCH_SIZE < students.length) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const succeeded      = results.filter((r) => r.status === "success").length;
  const skipped        = results.filter((r) => r.status === "skipped").length;
  const failed         = results.filter((r) => r.status === "error").length;
  const totalSkillRows = results.reduce((sum, r) => sum + r.skillsFound, 0);
  const finishedAt     = new Date().toISOString();

  const runResult: SkillSyncRunResult = {
    runId,
    startedAt,
    finishedAt,
    totalStudents: students.length,
    succeeded,
    skipped,
    failed,
    totalSkillRows,
    results,
  };

  console.log(
    `[SkillSync] ===== Job complete =====\n` +
    `  Students : ${students.length}\n` +
    `  Succeeded: ${succeeded}\n` +
    `  Skipped  : ${skipped}\n` +
    `  Failed   : ${failed}\n` +
    `  Skills   : ${totalSkillRows} rows upserted\n` +
    `  Duration : ${Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)}s`
  );

  // ── Persist run log ────────────────────────────────────────────────────────
  await persistRunLog(runResult);

  return runResult;
}

// ─── Utility: fetch recent run logs ───────────────────────────────────────────

export interface SyncLogRow extends RowDataPacket {
  id:             number;
  run_id:         string;
  started_at:     Date;
  finished_at:    Date;
  total_students: number;
  succeeded:      number;
  skipped:        number;
  failed:         number;
  total_skills:   number;
}

/**
 * Fetch the N most recent sync run summaries (for admin dashboard).
 */
export async function getRecentSyncLogs(limit = 10): Promise<SyncLogRow[]> {
  const connection = await pool.getConnection();
  try {
    try {
      const [rows] = await connection.execute<SyncLogRow[]>(
        `SELECT id, run_id, started_at, finished_at,
                total_students, succeeded, skipped, failed, total_skills
         FROM   skill_sync_logs
         ORDER  BY started_at DESC
         LIMIT  ?`,
        [limit]
      );
      return rows;
    } catch {
      // Table does not exist yet (first run before any sync)
      return [];
    }
  } finally {
    connection.release();
  }
}
