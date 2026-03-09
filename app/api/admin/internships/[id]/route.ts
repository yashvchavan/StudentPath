import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/admin/internships/[id]/applications — list applicants for an internship
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "college" || !user.college_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            // Verify internship belongs to this college
            const [check]: any = await connection.execute(
                "SELECT id FROM internships WHERE id = ? AND college_id = ? LIMIT 1",
                [parseInt(id), user.college_id]
            );
            if (check.length === 0) {
                return NextResponse.json({ error: "Not found" }, { status: 404 });
            }

            const [rows]: any = await connection.execute(
                `SELECT
                    ia.id AS application_id, ia.status, ia.cover_letter, ia.applied_at,
                    s.student_id AS student_id,
                    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    s.email, s.program, s.current_year, s.current_semester, s.current_gpa
                 FROM internship_applications ia
                 JOIN Students s ON s.student_id = ia.student_id
                 WHERE ia.internship_id = ?
                 ORDER BY ia.applied_at ASC`,
                [parseInt(id)]
            );

            return NextResponse.json({ success: true, data: rows ?? [] });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[GET /api/admin/internships/[id]/applications]", error);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}

// PUT /api/admin/internships/[id] — update an internship
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "college" || !user.college_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            company_name, logo_url, role, stipend, duration, description,
            eligibility, location, type, start_date, application_deadline,
            apply_process, rounds, required_skills, perks, is_active,
        } = body;

        const connection = await pool.getConnection();
        try {
            const [check]: any = await connection.execute(
                "SELECT id FROM internships WHERE id = ? AND college_id = ? LIMIT 1",
                [parseInt(id), user.college_id]
            );
            if (check.length === 0) {
                return NextResponse.json({ error: "Internship not found" }, { status: 404 });
            }

            await connection.execute(
                `UPDATE internships SET
                    company_name = COALESCE(?, company_name),
                    logo_url = COALESCE(?, logo_url),
                    role = COALESCE(?, role),
                    stipend = COALESCE(?, stipend),
                    duration = COALESCE(?, duration),
                    description = COALESCE(?, description),
                    eligibility = COALESCE(?, eligibility),
                    location = COALESCE(?, location),
                    type = COALESCE(?, type),
                    start_date = COALESCE(?, start_date),
                    application_deadline = COALESCE(?, application_deadline),
                    apply_process = COALESCE(?, apply_process),
                    rounds = COALESCE(?, rounds),
                    required_skills = COALESCE(?, required_skills),
                    perks = COALESCE(?, perks),
                    is_active = COALESCE(?, is_active)
                 WHERE id = ? AND college_id = ?`,
                [
                    company_name || null, logo_url || null, role || null,
                    stipend || null, duration || null, description || null,
                    eligibility || null, location || null, type || null,
                    start_date || null, application_deadline || null, apply_process || null,
                    rounds ? JSON.stringify(rounds) : null,
                    required_skills ? JSON.stringify(required_skills) : null,
                    perks || null,
                    is_active !== undefined ? (is_active ? 1 : 0) : null,
                    parseInt(id), user.college_id,
                ]
            );

            return NextResponse.json({ success: true, message: "Internship updated" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[PUT /api/admin/internships/[id]]", error);
        return NextResponse.json({ error: "Failed to update internship" }, { status: 500 });
    }
}

// DELETE /api/admin/internships/[id] — delete an internship
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "college" || !user.college_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            const [check]: any = await connection.execute(
                "SELECT id FROM internships WHERE id = ? AND college_id = ? LIMIT 1",
                [parseInt(id), user.college_id]
            );
            if (check.length === 0) {
                return NextResponse.json({ error: "Internship not found" }, { status: 404 });
            }

            await connection.execute("DELETE FROM internships WHERE id = ? AND college_id = ?", [
                parseInt(id), user.college_id,
            ]);

            return NextResponse.json({ success: true, message: "Internship deleted" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[DELETE /api/admin/internships/[id]]", error);
        return NextResponse.json({ error: "Failed to delete internship" }, { status: 500 });
    }
}
