import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/internships/[id]/experiences — list peer experiences for an internship
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                `SELECT
                    ie.*,
                    CONCAT(s.first_name, ' ', LEFT(s.last_name, 1), '.') AS student_display_name,
                    s.program, s.current_year
                 FROM internship_experiences ie
                 JOIN Students s ON s.student_id = ie.student_id
                 WHERE ie.internship_id = ?
                 ORDER BY ie.created_at DESC`,
                [parseInt(id)]
            );

            const safeParse = (val: any, fallback: any = []) => {
                if (!val) return fallback;
                if (typeof val === 'object') return val;
                try { return JSON.parse(val); } catch { return fallback; }
            };
            const experiences = rows.map((r: any) => ({
                ...r,
                selection_rounds: safeParse(r.selection_rounds),
            }));

            return NextResponse.json({ success: true, data: experiences });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[GET /api/internships/[id]/experiences]", error);
        return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 });
    }
}

// POST /api/internships/[id]/experiences — share your experience
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            company_name,
            role,
            duration,
            stipend,
            how_got_internship,
            selection_rounds,
            industry_experience,
            tips_for_applicants,
            rating,
            is_currently_interning,
            start_date,
            end_date,
        } = body;

        if (!company_name || !role) {
            return NextResponse.json({ error: "company_name and role are required" }, { status: 400 });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const studentId = parseInt(String(user.id));

            await connection.execute(
                `INSERT INTO internship_experiences
                    (internship_id, student_id, company_name, role, duration, stipend,
                     how_got_internship, selection_rounds, industry_experience,
                     tips_for_applicants, rating, is_currently_interning, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    parseInt(id),
                    studentId,
                    company_name,
                    role,
                    duration || null,
                    stipend || null,
                    how_got_internship || null,
                    selection_rounds ? JSON.stringify(selection_rounds) : null,
                    industry_experience || null,
                    tips_for_applicants || null,
                    rating || null,
                    is_currently_interning ? 1 : 0,
                    start_date || null,
                    end_date || null,
                ]
            );

            return NextResponse.json({ success: true, message: "Experience shared successfully" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[POST /api/internships/[id]/experiences]", error);
        return NextResponse.json({ error: "Failed to share experience" }, { status: 500 });
    }
}
