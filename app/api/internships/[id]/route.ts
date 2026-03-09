import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/internships/[id] — get details of a single internship
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
                    i.*,
                    (SELECT COUNT(*) FROM internship_applications ia WHERE ia.internship_id = i.id) AS application_count
                 FROM internships i
                 WHERE i.id = ? AND i.is_active = TRUE
                 LIMIT 1`,
                [parseInt(id)]
            );

            if (rows.length === 0) {
                return NextResponse.json({ error: "Internship not found" }, { status: 404 });
            }

            const safeParse = (val: any, fallback: any = []) => {
                if (!val) return fallback;
                if (typeof val === 'object') return val;
                try { return JSON.parse(val); } catch { return fallback; }
            };
            const internship = {
                ...rows[0],
                rounds: safeParse(rows[0].rounds),
                required_skills: safeParse(rows[0].required_skills),
            };

            return NextResponse.json({ success: true, data: internship });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[GET /api/internships/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch internship" }, { status: 500 });
    }
}
