import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/internships/my-applications — list the authenticated student's applications
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            const studentId = parseInt(String(user.id));

            const [rows]: any = await connection.execute(
                `SELECT
                    ia.id AS application_id,
                    ia.status,
                    ia.cover_letter,
                    ia.applied_at,
                    ia.updated_at,
                    i.id AS internship_id,
                    i.company_name,
                    i.logo_url,
                    i.role,
                    i.stipend,
                    i.duration,
                    i.location,
                    i.type,
                    i.start_date,
                    i.application_deadline
                 FROM internship_applications ia
                 JOIN internships i ON i.id = ia.internship_id
                 WHERE ia.student_id = ?
                 ORDER BY ia.applied_at DESC`,
                [studentId]
            );

            return NextResponse.json({ success: true, data: rows });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[GET /api/internships/my-applications]", error);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}
