/**
 * GET /api/resume/history
 *
 * Get all resume uploads and their analyses for the authenticated student.
 * Returns resumes with nested analyses, ordered by most recent first.
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

        // 2. Fetch all resumes for this student
        const [resumes]: any = await pool.execute(
            `SELECT id, file_url, file_name, file_type, created_at
       FROM resumes
       WHERE student_id = ?
       ORDER BY created_at DESC`,
            [user.id]
        );

        // 3. Fetch all analyses for this student
        const [analyses]: any = await pool.execute(
            `SELECT id, resume_id, company_name, company_id, target_role,
              ats_score, section_scores, feedback_json, rejection_reasons,
              skill_gaps, improvement_steps, created_at
       FROM resume_analyses
       WHERE student_id = ?
       ORDER BY created_at DESC`,
            [user.id]
        );

        // 4. Group analyses by resume_id
        const analysisMap: Record<number, any[]> = {};
        for (const analysis of analyses) {
            const rid = analysis.resume_id;
            if (!analysisMap[rid]) analysisMap[rid] = [];

            // Parse JSON fields
            analysisMap[rid].push({
                ...analysis,
                section_scores: safeJsonParse(analysis.section_scores),
                feedback_json: safeJsonParse(analysis.feedback_json),
                rejection_reasons: safeJsonParse(analysis.rejection_reasons),
                skill_gaps: safeJsonParse(analysis.skill_gaps),
                improvement_steps: safeJsonParse(analysis.improvement_steps),
            });
        }

        // 5. Build response
        const result = resumes.map((resume: any) => ({
            ...resume,
            analyses: analysisMap[resume.id] || [],
            latest_score: analysisMap[resume.id]?.[0]?.ats_score || null,
            total_analyses: (analysisMap[resume.id] || []).length,
        }));

        return NextResponse.json({
            success: true,
            resumes: result,
            total: resumes.length,
        });
    } catch (error) {
        console.error("[Resume History] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch resume history" },
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
