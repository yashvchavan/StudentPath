import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/internships — list active internships for the student's college
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            // Fetch the student's college_id
            const [studentRows]: any = await connection.execute(
                "SELECT college_id FROM students WHERE id = ? LIMIT 1",
                [user.id]
            );
            const collegeId = studentRows[0]?.college_id;

            // Build query — if student has a college, filter to that college only
            let query = `
                SELECT
                    i.id, i.company_name, i.logo_url, i.role, i.stipend, i.duration,
                    i.description, i.eligibility, i.location, i.type, i.start_date,
                    i.application_deadline, i.apply_process, i.rounds, i.required_skills,
                    i.perks, i.created_at,
                    (SELECT COUNT(*) FROM internship_applications ia WHERE ia.internship_id = i.id) AS application_count
                FROM internships i
                WHERE i.is_active = TRUE
            `;
            const params: any[] = [];

            if (collegeId) {
                query += " AND i.college_id = ?";
                params.push(collegeId);
            }

            query += " ORDER BY i.created_at DESC";

            const [rows]: any = await connection.execute(query, params);

            const safeParse = (val: any, fallback: any = []) => {
                if (!val) return fallback;
                if (typeof val === 'object') return val;
                try { return JSON.parse(val); } catch { return fallback; }
            };
            const internships = rows.map((r: any) => ({
                ...r,
                rounds: safeParse(r.rounds),
                required_skills: safeParse(r.required_skills),
            }));

            return NextResponse.json({ success: true, data: internships });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[GET /api/internships]", error);
        return NextResponse.json({ error: "Failed to fetch internships" }, { status: 500 });
    }
}
