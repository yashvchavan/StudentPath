/**
 * API Route: POST /api/resume/extract-skills
 *
 * Extracts a structured skill profile from an already-uploaded resume.
 *
 * Two modes:
 *  A) { resumeId: number }  — loads parsed_text from the `resumes` table
 *  B) { resumeText: string } — use raw text directly (for testing / pipeline use)
 *
 * Optionally persists the result to the student's technical_skills JSON column.
 *
 * Response:
 *  { success: true, profile: ResumeSkillProfile, merged: boolean }
 *  | { error: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";
import {
  extractSkillsFromResume,
  mergeSkillsIntoStudentRecord,
  type ResumeSkillProfile,
} from "@/lib/resume/skillExtractor";

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let connection;
  try {
    // 1. Auth check
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { resumeId, resumeText: directText, persist = true } = body as {
      resumeId?: number;
      resumeText?: string;
      /** If true (default), saves extracted skills back to the Students row */
      persist?: boolean;
    };

    // 2. Resolve the resume plain-text
    let plainText: string | null = null;

    if (directText) {
      plainText = directText;
    } else if (resumeId) {
      connection = await pool.getConnection();

      // Make sure the resume belongs to this student
      const [rows] = await connection.execute<any[]>(
        `SELECT parsed_text FROM resumes
         WHERE id = ? AND student_id = ?
         LIMIT 1`,
        [resumeId, user.id]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "Resume not found or does not belong to this student." },
          { status: 404 }
        );
      }

      plainText = rows[0].parsed_text ?? null;
    }

    if (!plainText || plainText.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "Resume text is empty or too short. Re-upload the file or provide resumeText directly.",
        },
        { status: 400 }
      );
    }

    // 3. Extract skill profile
    const profile: ResumeSkillProfile = await extractSkillsFromResume(plainText);

    // 4. Optionally persist skills back to the student record
    let merged = false;
    if (persist) {
      if (!connection) connection = await pool.getConnection();

      // Fetch the current technical_skills JSON so we can merge cleanly
      const [studentRows] = await connection.execute<any[]>(
        "SELECT technical_skills FROM Students WHERE student_id = ? LIMIT 1",
        [user.id]
      );

      const existingRaw: string | null = studentRows[0]?.technical_skills ?? null;
      let existing: Record<string, unknown> | null = null;

      try {
        existing = existingRaw ? JSON.parse(existingRaw) : null;
      } catch {
        existing = null; // corrupt JSON — start fresh
      }

      const updated = mergeSkillsIntoStudentRecord(existing, profile);

      await connection.execute(
        `UPDATE Students
         SET technical_skills = ?, updated_at = NOW()
         WHERE student_id = ?`,
        [JSON.stringify(updated), user.id]
      );

      merged = true;
    }

    return NextResponse.json({ success: true, profile, merged });

  } catch (err) {
    console.error("[POST /api/resume/extract-skills]", err);
    return NextResponse.json(
      { error: "Skill extraction failed. Please try again." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
