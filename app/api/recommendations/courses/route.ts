/**
 * POST /api/recommendations/courses
 *
 * Get course recommendations for a list of missing skills.
 *
 * Request body:
 *   {
 *     "missingSkills": ["React", "Docker", "PostgreSQL"],
 *     "studentId": 42          (optional — used for cache attribution)
 *   }
 *
 * GET /api/recommendations/courses?studentId=42
 *   Computes missing skills automatically by comparing the student's
 *   existing skills (from student_skills table) against their goal tech stack.
 *
 * GET /api/recommendations/courses/cache
 *   Lists all cached skill entries (admin use).
 *
 * Response:
 *   {
 *     success: true,
 *     data: CourseRecommendationResult
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  recommendCourses,
  invalidateCourseCache,
  listCachedSkills,
  type CourseRecommendationResult,
} from "@/lib/recommendations/courseEngine";

// ─── POST — recommend from caller-provided skill list ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { missingSkills, studentId } = body as {
      missingSkills?: string[];
      studentId?:     number;
    };

    if (!Array.isArray(missingSkills) || missingSkills.length === 0) {
      return NextResponse.json(
        { error: "`missingSkills` must be a non-empty string array." },
        { status: 400 }
      );
    }

    if (missingSkills.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 skills per request." },
        { status: 400 }
      );
    }

    const data: CourseRecommendationResult = await recommendCourses(
      missingSkills,
      studentId
    );

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("[POST /api/recommendations/courses]", err);
    return NextResponse.json(
      { error: err?.message ?? "Course recommendation failed." },
      { status: 500 }
    );
  }
}

// ─── GET — auto-compute missing skills from student profile ──────────────────
export async function GET(req: NextRequest) {
  const params    = req.nextUrl.searchParams;
  const studentId = Number(params.get("studentId"));
  const action    = params.get("action");  // "invalidate-cache" | "list-cache"

  // ── Admin: list cache entries ─────────────────────────────────────────────
  if (action === "list-cache") {
    try {
      const entries = await listCachedSkills();
      return NextResponse.json({ success: true, entries });
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to list cache." },
        { status: 500 }
      );
    }
  }

  // ── Admin: invalidate cache ────────────────────────────────────────────────
  if (action === "invalidate-cache") {
    const skillsParam = params.get("skills");
    const skills      = skillsParam ? skillsParam.split(",").map((s) => s.trim()) : undefined;
    try {
      const deleted = await invalidateCourseCache(skills);
      return NextResponse.json({
        success: true,
        message: `Invalidated ${deleted} cache entries.`,
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Cache invalidation failed." },
        { status: 500 }
      );
    }
  }

  // ── Skill-gap mode: auto-compute missing skills from DB ───────────────────
  if (!studentId || isNaN(studentId)) {
    return NextResponse.json(
      {
        error:
          "Provide `studentId` query param to auto-compute missing skills, " +
          "or use POST with `missingSkills` array.",
      },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch the student's existing skills from student_skills table
    const [skillRows] = await connection.execute<any[]>(
      `SELECT skill_name, proficiency_score
       FROM student_skills
       WHERE student_id = ?
       ORDER BY proficiency_score DESC`,
      [studentId]
    );

    // Fetch student's career goal / target tech stack from Students
    const [studentRows] = await connection.execute<any[]>(
      `SELECT technical_skills, merged_skills, primary_goal, industry_focus
       FROM Students
       WHERE student_id = ? AND is_active = TRUE
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows.length) {
      return NextResponse.json(
        { error: `Student ${studentId} not found.` },
        { status: 404 }
      );
    }

    const existingSkillNames = new Set<string>(
      skillRows.map((r: any) => (r.skill_name as string).toLowerCase())
    );

    // Extract desired skills from merged_skills column (dedicated AI passport)
    let desiredSkills: string[] = [];
    try {
      // First try the new dedicated merged_skills column
      const rawMerged = studentRows[0].merged_skills;
      const parsedMerged = typeof rawMerged === 'string' ? JSON.parse(rawMerged) : rawMerged;
      if (Array.isArray(parsedMerged) && parsedMerged.length > 0) {
        // Use skills with low proficiency (below 5 on 0-10 scale) as gaps
        desiredSkills = parsedMerged
          .filter((s: any) => typeof s.proficiency === 'number' && s.proficiency < 5)
          .map((s: any) => s.skill as string);
      }

      // Fallback: try technical_skills if merged_skills has no gaps
      if (!desiredSkills.length) {
        const raw = studentRows[0].technical_skills;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          desiredSkills = parsed;
        } else if (parsed?.desired_skills) {
          desiredSkills = parsed.desired_skills;
        }
      }
    } catch { /* ignore parse errors */ }

    // Skills with proficiency < 6 (below "Advanced") — needs improvement
    const lowProficiencySkills = skillRows
      .filter((r: any) => r.proficiency_score < 6)
      .map((r: any) => r.skill_name as string);

    const truelyMissing = desiredSkills.filter(
      (s) => !existingSkillNames.has(s.toLowerCase())
    );

    let missingSkills = Array.from(
      new Set([...truelyMissing, ...lowProficiencySkills])
    ).slice(0, 15); // Cap at 15

    // ── Fallback: if nothing found, always recommend for the 5 lowest-scoring skills ──
    if (!missingSkills.length && skillRows.length > 0) {
      // Sort ascending by proficiency, take bottom 5
      missingSkills = [...skillRows]
        .sort((a: any, b: any) => a.proficiency_score - b.proficiency_score)
        .slice(0, 5)
        .map((r: any) => r.skill_name as string);
    }

    // ── Secondary fallback: still nothing? pick 5 popular learning topics ──
    if (!missingSkills.length) {
      missingSkills = ["Communication", "Problem Solving", "Data Structures", "System Design", "Git"];
    }

    // Always return at least 5 skills for course recommendations
    if (missingSkills.length < 5 && skillRows.length > 0) {
      const extra = [...skillRows]
        .sort((a: any, b: any) => a.proficiency_score - b.proficiency_score)
        .map((r: any) => r.skill_name as string)
        .filter((s: string) => !missingSkills.includes(s));
      missingSkills = [...missingSkills, ...extra].slice(0, 5);
    }

    const data = await recommendCourses(missingSkills, studentId);

    return NextResponse.json({
      success:       true,
      missingSkills,
      existingCount: skillRows.length,
      data,
    });

  } catch (err: any) {
    console.error("[GET /api/recommendations/courses]", err);
    return NextResponse.json(
      { error: err?.message ?? "Recommendation failed." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
