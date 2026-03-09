import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/admin/internships — list internships posted by the college
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "college" || !user.college_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                `SELECT
                    i.*,
                    (SELECT COUNT(*) FROM internship_applications ia WHERE ia.internship_id = i.id) AS application_count
                 FROM internships i
                 WHERE i.college_id = ?
                 ORDER BY i.created_at DESC`,
                [user.college_id]
            );

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
        console.error("[GET /api/admin/internships]", error);
        return NextResponse.json({ error: "Failed to fetch internships" }, { status: 500 });
    }
}

// POST /api/admin/internships — create a new internship
export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "college" || !user.college_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            company_name,
            logo_url,
            role,
            stipend,
            duration,
            description,
            eligibility,
            location,
            type,
            start_date,
            application_deadline,
            apply_process,
            rounds,
            required_skills,
            perks,
        } = body;

        if (!company_name || !role) {
            return NextResponse.json({ error: "company_name and role are required" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                `INSERT INTO internships
                    (college_id, company_name, logo_url, role, stipend, duration, description,
                     eligibility, location, type, start_date, application_deadline,
                     apply_process, rounds, required_skills, perks)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.college_id,
                    company_name,
                    logo_url || null,
                    role,
                    stipend || null,
                    duration || null,
                    description || null,
                    eligibility || null,
                    location || null,
                    type || "in-office",
                    start_date || null,
                    application_deadline || null,
                    apply_process || null,
                    rounds ? JSON.stringify(rounds) : null,
                    required_skills ? JSON.stringify(required_skills) : null,
                    perks || null,
                ]
            );

            return NextResponse.json({
                success: true,
                id: result.insertId,
                message: "Internship created successfully",
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[POST /api/admin/internships]", error);
        return NextResponse.json({ error: "Failed to create internship" }, { status: 500 });
    }
}
