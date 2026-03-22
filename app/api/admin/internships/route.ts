import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getTpoSession, validateDepartmentTargets } from "@/lib/tpo-auth";
import pool from "@/lib/db";

// GET /api/admin/internships — list internships posted by the college
export async function GET(req: NextRequest) {
    try {
        // Use TPO session for role-based access
        const session = await getTpoSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            // Build query based on role
            let whereClause = "i.college_id = ?";
            const params: any[] = [session.college_id];

            // Dept TPO can only see internships targeting their department
            if (session.isDeptTPO && session.department_id) {
                whereClause += ` AND (i.department_ids IS NULL OR JSON_CONTAINS(i.department_ids, ?))`;
                params.push(JSON.stringify(session.department_id));
            }

            const [rows]: any = await connection.execute(
                `SELECT
                    i.*,
                    (SELECT COUNT(*) FROM internship_applications ia WHERE ia.internship_id = i.id) AS application_count
                 FROM internships i
                 WHERE ${whereClause}
                 ORDER BY i.created_at DESC`,
                params
            );

            const safeParse = (val: any, fallback: any = []) => {
                if (!val) return fallback;
                if (typeof val === 'object') return val;
                try { return JSON.parse(val); } catch { return fallback; }
            };

            // Get department names for the department_ids
            const departmentIds = new Set<number>();
            rows.forEach((r: any) => {
                const deptIds = safeParse(r.department_ids, []);
                if (Array.isArray(deptIds)) {
                    deptIds.forEach((id: number) => departmentIds.add(id));
                }
            });

            let departmentMap: Record<number, string> = {};
            if (departmentIds.size > 0) {
                const [depts]: any = await connection.execute(
                    `SELECT id, name FROM departments WHERE id IN (${Array.from(departmentIds).join(',') || '0'})`
                );
                depts.forEach((d: any) => {
                    departmentMap[d.id] = d.name;
                });
            }

            const internships = rows.map((r: any) => {
                const deptIds = safeParse(r.department_ids, []);
                return {
                    ...r,
                    rounds: safeParse(r.rounds),
                    required_skills: safeParse(r.required_skills),
                    department_ids: deptIds,
                    department_names: Array.isArray(deptIds)
                        ? deptIds.map((id: number) => departmentMap[id] || `Dept ${id}`)
                        : [],
                    targets_all_departments: !deptIds || deptIds.length === 0,
                };
            });

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
        // Use TPO session for role-based access
        const session = await getTpoSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check permission for managing internships
        if (session.isDeptTPO && !session.canManageInternships) {
            return NextResponse.json(
                { error: "You don't have permission to create internships" },
                { status: 403 }
            );
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
            department_ids, // NEW: target departments
        } = body;

        if (!company_name || !role) {
            return NextResponse.json({ error: "company_name and role are required" }, { status: 400 });
        }

        // Validate and scope department targeting
        let targetDepartments: number[] | null = null;
        try {
            targetDepartments = validateDepartmentTargets(session, department_ids);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                `INSERT INTO internships
                    (college_id, company_name, logo_url, role, stipend, duration, description,
                     eligibility, location, type, start_date, application_deadline,
                     apply_process, rounds, required_skills, perks, department_ids)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    session.college_id,
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
                    targetDepartments ? JSON.stringify(targetDepartments) : null,
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
