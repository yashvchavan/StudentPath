/**
 * GET /api/resume/compare?resumeId=X
 *
 * Compare ATS scores for a single resume across multiple companies.
 * Returns all analyses for the given resume, enabling side-by-side comparison.
 * Auth: Student only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        // 1. Auth check
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get resumeId from query params
        const { searchParams } = new URL(req.url);
        const resumeId = searchParams.get("resumeId");

        if (!resumeId) {
            return NextResponse.json(
                { error: "Missing required query parameter: resumeId" },
                { status: 400 }
            );
        }

        // 3. Verify resume belongs to student
        const [resumes]: any = await pool.execute(
            "SELECT id, file_name, file_url, created_at FROM resumes WHERE id = ? AND student_id = ?",
            [resumeId, user.id]
        );

        if (resumes.length === 0) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        // 4. Fetch all analyses for this resume
        const [analyses]: any = await pool.execute(
            `SELECT id, company_name, company_id, target_role,
              ats_score, section_scores, rejection_reasons,
              skill_gaps, improvement_steps, created_at
       FROM resume_analyses
       WHERE resume_id = ? AND student_id = ?
       ORDER BY ats_score DESC`,
            [resumeId, user.id]
        );

        // 5. Parse JSON fields and build comparison data
        const comparisonData = analyses.map((analysis: any) => ({
            ...analysis,
            section_scores: safeJsonParse(analysis.section_scores),
            rejection_reasons: safeJsonParse(analysis.rejection_reasons),
            skill_gaps: safeJsonParse(analysis.skill_gaps),
            improvement_steps: safeJsonParse(analysis.improvement_steps),
        }));

        return NextResponse.json({
            success: true,
            resume: resumes[0],
            comparisons: comparisonData,
            total: comparisonData.length,
        });
    } catch (error) {
        console.error("[Resume Compare] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch comparison data" },
            { status: 500 }
        );
    }
}

function safeJsonParse(value: any): any {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}
