/**
 * POST /api/integrations/skill-merge
 *
 * Runs the full skill pipeline for a student:
 *   GitHub repos → LeetCode tags → Resume text
 *   → mergeAllSources() → upsertStudentSkills()
 *
 * Also updates Students.technical_skills (JSON summary) via upsertStudentSkills.
 *
 * ─── Request body ─────────────────────────────────────────────────────────────
 *
 * Mode A — full pipeline by studentId:
 *   { "studentId": 42 }
 *   Looks up github_username, leetcode_username, and latest resume text from DB.
 *   Runs all three analysers concurrently (graceful partial failures).
 *   Saves results to student_skills table + Students.technical_skills.
 *
 * Mode B — direct flat arrays (testing / partial updates):
 *   {
 *     "githubSkills":   ["React", "TypeScript"],
 *     "leetcodeSkills": ["Arrays", "Graphs"],
 *     "resumeSkills":   ["Python", "Docker"]
 *   }
 *   Merges and returns without DB persistence.
 *
 * ─── Response ─────────────────────────────────────────────────────────────────
 *   {
 *     success: true,
 *     result: MergeResult,
 *     persisted?: { rows: number; table: "student_skills" }
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { analyzeGitHubProfile }   from "@/lib/integrations/githubAnalyzer";
import { analyzeLeetCodeProfile }  from "@/lib/integrations/leetcodeAnalyzer";
import { extractSkillsFromResume } from "@/lib/resume/skillExtractor";
import {
  mergeSkills,
  mergeAllSources,
  type SourceSkillMap,
  type MergeResult,
} from "@/lib/skill-engine/mergeSkills";
import { upsertStudentSkills } from "@/lib/skill-engine/studentSkillsDb";

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let connection;

  try {
    const body = await req.json();
    const { studentId, githubSkills, leetcodeSkills, resumeSkills } = body as {
      studentId?:     number;
      githubSkills?:  string[];
      leetcodeSkills?: string[];
      resumeSkills?:  string[];
    };

    // ── Mode B: caller passes flat arrays directly ────────────────────────────
    if (!studentId) {
      if (!githubSkills && !leetcodeSkills && !resumeSkills) {
        return NextResponse.json(
          {
            error:
              "Provide `studentId` OR at least one of " +
              "`githubSkills`, `leetcodeSkills`, `resumeSkills`.",
          },
          { status: 400 }
        );
      }

      const input: SourceSkillMap = {
        github:   githubSkills,
        leetcode: leetcodeSkills,
        resume:   resumeSkills,
      };
      const result: MergeResult = mergeSkills(input);
      return NextResponse.json({ success: true, result });
    }

    // ── Mode A: resolve from DB by studentId ─────────────────────────────────
    connection = await pool.getConnection();

    // Fetch student identifiers + latest resume text in one query
    const [rows] = await connection.execute<any[]>(
      `SELECT
         s.student_id,
         s.github_username,
         s.leetcode_username,
         s.soft_skills,
         (
           SELECT r.parsed_text
           FROM   resumes r
           WHERE  r.student_id = s.student_id
           ORDER  BY r.created_at DESC
           LIMIT  1
         ) AS resume_text
       FROM Students s
       WHERE s.student_id = ?
         AND s.is_active  = TRUE
       LIMIT 1`,
      [studentId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: `Student with id ${studentId} not found.` },
        { status: 404 }
      );
    }

    const { github_username, leetcode_username, resume_text } = rows[0];

    // ── Run all three analysers concurrently ──────────────────────────────────
    // Promise.allSettled guarantees we get results even if one fails
    const [ghSettled, lcSettled, resSettled] = await Promise.allSettled([
      github_username
        ? analyzeGitHubProfile(github_username)
        : Promise.resolve(null),
      leetcode_username
        ? analyzeLeetCodeProfile(leetcode_username)
        : Promise.resolve(null),
      resume_text
        ? extractSkillsFromResume(resume_text)
        : Promise.resolve(null),
    ]);

    // Unwrap settled results, logging partial failures
    const gh  = ghSettled.status  === "fulfilled" ? ghSettled.value  : null;
    const lc  = lcSettled.status  === "fulfilled" ? lcSettled.value  : null;
    const res = resSettled.status === "fulfilled" ? resSettled.value : null;

    if (ghSettled.status  === "rejected")
      console.warn("[SkillMerge] GitHub analysis failed:",  ghSettled.reason);
    if (lcSettled.status  === "rejected")
      console.warn("[SkillMerge] LeetCode analysis failed:", lcSettled.reason);
    if (resSettled.status === "rejected")
      console.warn("[SkillMerge] Resume extraction failed:", resSettled.reason);

    // ── Merge ─────────────────────────────────────────────────────────────────
    const result: MergeResult = mergeAllSources(
      gh  ? gh.skillProfile : null,
      lc  ? lc.dsaProfile   : null,
      res ?? null
    );

    // ── Persist ───────────────────────────────────────────────────────────────
    // upsertStudentSkills writes to student_skills table AND updates
    // Students.technical_skills JSON column in a single call.
    const affectedRows = await upsertStudentSkills(studentId, result);

    return NextResponse.json({
      success:   true,
      result,
      persisted: {
        rows:  affectedRows,
        table: "student_skills",
      },
      sources: {
        github:   !!gh,
        leetcode: !!lc,
        resume:   !!res,
      },
    });

  } catch (err) {
    console.error("[POST /api/integrations/skill-merge]", err);
    return NextResponse.json(
      { error: "Skill merge failed. Please try again." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ─── GET /api/integrations/skill-merge?studentId=42 ─────────────────────────
// Quick read-only fetch from the student_skills table (no analysis re-run).

import {
  getStudentSkills,
  getSkillsBySource,
} from "@/lib/skill-engine/studentSkillsDb";
import type { SkillSource } from "@/lib/skill-engine/mergeSkills";

export async function GET(req: NextRequest) {
  const params     = req.nextUrl.searchParams;
  const studentId  = Number(params.get("studentId"));
  const source     = params.get("source") as SkillSource | null;

  if (!studentId || isNaN(studentId)) {
    return NextResponse.json(
      { error: "Query param `studentId` (number) is required." },
      { status: 400 }
    );
  }

  try {
    const skills = source
      ? await getSkillsBySource(studentId, source)
      : await getStudentSkills(studentId);

    return NextResponse.json({
      success: true,
      studentId,
      filter:  source ?? "all",
      count:   skills.length,
      skills,
    });
  } catch (err) {
    console.error("[GET /api/integrations/skill-merge]", err);
    return NextResponse.json(
      { error: "Failed to fetch skills." },
      { status: 500 }
    );
  }
}
