/**
 * Student Skills DB Layer — lib/skill-engine/studentSkillsDb.ts
 *
 * All database operations for the `student_skills` table.
 *
 * Schema (already created in MySQL Workbench):
 *   student_skills (
 *     id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 *     student_id       INT,            -- FK → Students.student_id
 *     skill_name       VARCHAR(120),
 *     proficiency_score TINYINT UNSIGNED,   -- 0-10
 *     confidence_score  DECIMAL(3,2),       -- 0.00-1.00
 *     sources_json     JSON,
 *     created_at       TIMESTAMP,
 *     updated_at       TIMESTAMP
 *   )
 *   UNIQUE KEY (student_id, skill_name)
 *
 * Exported functions:
 *   upsertStudentSkills(studentId, skills)
 *   getStudentSkills(studentId, minProficiency?, minConfidence?)
 *   getSkillsBySource(studentId, source)
 *   getMultiSourceSkills(studentId)
 *   deleteStudentSkills(studentId, source?)
 *   getStudentSkill(studentId, skillName)
 *   getTopSkills(limit?, minStudents?)
 */

import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { MergedSkill, MergeResult, SkillSource } from "./mergeSkills";

// ─── DB Row type ──────────────────────────────────────────────────────────────

export interface StudentSkillRow extends RowDataPacket {
  id: number;
  student_id: number;
  skill_name: string;
  proficiency_score: number;   // TINYINT 0-10
  confidence_score: number;    // DECIMAL(3,2) 0.00-1.00
  sources_json: string;        // Raw JSON string e.g. '["github","resume"]'
  created_at: Date;
  updated_at: Date;
}

// ─── Caller-facing type ───────────────────────────────────────────────────────

export interface StudentSkillRecord {
  id: number;
  studentId: number;
  skillName: string;
  proficiency: number;
  confidence: number;
  sources: SkillSource[];
  createdAt: string;
  updatedAt: string;
}

// ─── Platform-wide analytics type ────────────────────────────────────────────

export interface TopSkillStat {
  skillName: string;
  studentCount: number;
  avgProficiency: number;
  avgConfidence: number;
}

// ─── Internal mapper ─────────────────────────────────────────────────────────

function mapRow(row: StudentSkillRow): StudentSkillRecord {
  let sources: SkillSource[] = [];
  try {
    const raw =
      typeof row.sources_json === "string"
        ? JSON.parse(row.sources_json)
        : row.sources_json;
    sources = Array.isArray(raw) ? (raw as SkillSource[]) : [];
  } catch {
    sources = [];
  }

  return {
    id:          row.id,
    studentId:   row.student_id,
    skillName:   row.skill_name,
    proficiency: row.proficiency_score,
    confidence:  Number(row.confidence_score),
    sources,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

// ─── 1. upsertStudentSkills ───────────────────────────────────────────────────

/**
 * Bulk-insert or update merged skills for a student.
 *
 * Accepts either:
 *  - A full MergeResult  (comes straight from mergeAllSources / mergeSkills)
 *  - An array of MergedSkill (when you already have the flat list)
 *
 * Uses INSERT … ON DUPLICATE KEY UPDATE — fully idempotent, safe to re-run.
 *
 * @param studentId  Students.student_id
 * @param input      MergeResult or MergedSkill[]
 * @returns          MySQL affectedRows count
 */
export async function upsertStudentSkills(
  studentId: number,
  input: MergeResult | MergedSkill[]
): Promise<number> {
  // Normalise both accepted shapes to a flat skill array
  const skills: MergedSkill[] = Array.isArray(input)
    ? input
    : (input as MergeResult).skills;

  if (!skills.length) return 0;

  const connection = await pool.getConnection();
  try {
    // Multi-row VALUES list: one tuple per skill
    const placeholders = skills.map(() => "(?, ?, ?, ?, ?)").join(", ");

    const values: (string | number)[] = [];
    for (const s of skills) {
      values.push(
        studentId,
        s.skill,
        s.proficiency,
        s.confidence,
        JSON.stringify(s.sources)
      );
    }

    const sql = `
      INSERT INTO student_skills
        (student_id, skill_name, proficiency_score, confidence_score, sources_json)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        proficiency_score = VALUES(proficiency_score),
        confidence_score  = VALUES(confidence_score),
        sources_json      = VALUES(sources_json),
        updated_at        = CURRENT_TIMESTAMP
    `;

    const [res] = await connection.execute<ResultSetHeader>(sql, values);

    // Write merged skills to the dedicated column (never pollute technical_skills)
    const summary = skills.map((s) => ({
      skill:       s.skill,
      proficiency: s.proficiency,
      confidence:  s.confidence,
      sources:     s.sources,
    }));

    await connection.execute(
      `UPDATE Students
       SET merged_skills       = CAST(? AS JSON),
           last_skill_analysis = NOW(),
           updated_at          = NOW()
       WHERE student_id = ?`,
      [JSON.stringify(summary), studentId]
    );

    return res.affectedRows;
  } finally {
    connection.release();
  }
}

// ─── 2. getStudentSkills ─────────────────────────────────────────────────────

/**
 * Fetch all skill rows for a student from the student_skills table.
 * Ordered by proficiency DESC, confidence DESC, then skill name ASC.
 *
 * @param studentId       Students.student_id
 * @param minProficiency  Optional lower bound (0-10, default 0)
 * @param minConfidence   Optional lower bound (0.0-1.0, default 0)
 */
export async function getStudentSkills(
  studentId: number,
  minProficiency = 0,
  minConfidence = 0
): Promise<StudentSkillRecord[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<StudentSkillRow[]>(
      `SELECT
         ss.id,
         ss.student_id,
         ss.skill_name,
         ss.proficiency_score,
         ss.confidence_score,
         ss.sources_json,
         ss.created_at,
         ss.updated_at
       FROM student_skills ss
       INNER JOIN Students s ON s.student_id = ss.student_id
       WHERE ss.student_id        = ?
         AND ss.proficiency_score >= ?
         AND ss.confidence_score  >= ?
         AND s.is_active          = TRUE
       ORDER BY ss.proficiency_score DESC,
                ss.confidence_score  DESC,
                ss.skill_name        ASC`,
      [studentId, minProficiency, minConfidence]
    );
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}

// ─── 3. getSkillsBySource ────────────────────────────────────────────────────

/**
 * Return skills for a student that were reported by a specific source.
 * Uses MySQL JSON_CONTAINS for the sources_json array lookup.
 *
 * @param studentId  Students.student_id
 * @param source     "github" | "leetcode" | "resume"
 */
export async function getSkillsBySource(
  studentId: number,
  source: SkillSource
): Promise<StudentSkillRecord[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<StudentSkillRow[]>(
      `SELECT ss.*
       FROM student_skills ss
       INNER JOIN Students s ON s.student_id = ss.student_id
       WHERE ss.student_id = ?
         AND JSON_CONTAINS(ss.sources_json, JSON_QUOTE(?))
         AND s.is_active   = TRUE
       ORDER BY ss.proficiency_score DESC`,
      [studentId, source]
    );
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}

// ─── 4. getMultiSourceSkills ─────────────────────────────────────────────────

/**
 * Skills validated by 2 or more sources — confidence = 0.95.
 * These are the highest-quality entries in the table.
 */
export async function getMultiSourceSkills(
  studentId: number
): Promise<StudentSkillRecord[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<StudentSkillRow[]>(
      `SELECT ss.*
       FROM student_skills ss
       INNER JOIN Students s ON s.student_id = ss.student_id
       WHERE ss.student_id           = ?
         AND JSON_LENGTH(ss.sources_json) >= 2
         AND s.is_active              = TRUE
       ORDER BY ss.proficiency_score DESC, ss.skill_name ASC`,
      [studentId]
    );
    return rows.map(mapRow);
  } finally {
    connection.release();
  }
}

// ─── 5. deleteStudentSkills ──────────────────────────────────────────────────

/**
 * Delete skill rows for a student.
 * If `source` is provided, only rows containing that source are deleted.
 * Otherwise all rows for the student are removed (clean-slate before re-merge).
 *
 * @param studentId  Students.student_id
 * @param source     Optional — limit deletion to one source
 */
export async function deleteStudentSkills(
  studentId: number,
  source?: SkillSource
): Promise<number> {
  const connection = await pool.getConnection();
  try {
    let sql: string;
    let params: unknown[];

    if (source) {
      sql = `DELETE FROM student_skills
             WHERE student_id = ?
               AND JSON_CONTAINS(sources_json, JSON_QUOTE(?))`;
      params = [studentId, source];
    } else {
      sql = `DELETE FROM student_skills WHERE student_id = ?`;
      params = [studentId];
    }

    const [res] = await connection.execute<ResultSetHeader>(sql, params);
    return res.affectedRows;
  } finally {
    connection.release();
  }
}

// ─── 6. getStudentSkill (single skill lookup) ────────────────────────────────

/**
 * Look up one specific skill for a student.
 * Returns null if not found.
 */
export async function getStudentSkill(
  studentId: number,
  skillName: string
): Promise<StudentSkillRecord | null> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<StudentSkillRow[]>(
      `SELECT ss.*
       FROM student_skills ss
       WHERE ss.student_id = ? AND ss.skill_name = ?
       LIMIT 1`,
      [studentId, skillName]
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } finally {
    connection.release();
  }
}

// ─── 7. getTopSkills (platform analytics) ───────────────────────────────────

/**
 * Platform-wide skill leaderboard.
 * Aggregates across all students — useful for admin dashboards.
 *
 * @param limit       Number of skills to return (default 20)
 * @param minStudents Only include skills held by at least N students
 */
export async function getTopSkills(
  limit = 20,
  minStudents = 1
): Promise<TopSkillStat[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT
         ss.skill_name                      AS skillName,
         COUNT(*)                           AS studentCount,
         ROUND(AVG(ss.proficiency_score),1) AS avgProficiency,
         ROUND(AVG(ss.confidence_score), 2) AS avgConfidence
       FROM student_skills ss
       INNER JOIN Students s ON s.student_id = ss.student_id
       WHERE s.is_active = TRUE
       GROUP BY ss.skill_name
       HAVING studentCount >= ?
       ORDER BY avgProficiency DESC, studentCount DESC
       LIMIT ?`,
      [minStudents, limit]
    );
    return rows as TopSkillStat[];
  } finally {
    connection.release();
  }
}
