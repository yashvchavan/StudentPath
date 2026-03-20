import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getTpoSession, requireCentralTpo } from "@/lib/tpo-auth";

// GET /api/admin/departments - List all departments for the college
export async function GET(req: NextRequest) {
  try {
    const session = await getTpoSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      // Get departments with student counts and TPO assignments
      const [departments]: any = await connection.execute(
        `SELECT
          d.*,
          COUNT(DISTINCT s.student_id) as student_count,
          COUNT(DISTINCT CASE WHEN s.placement_status = 'placed' THEN s.student_id END) as placed_count,
          MAX(tu.id) as tpo_id,
          MAX(tu.name) as tpo_name,
          MAX(tu.email) as tpo_email
        FROM departments d
        LEFT JOIN Students s ON s.department_id = d.id AND s.is_active = TRUE
        LEFT JOIN tpo_users tu ON tu.department_id = d.id AND tu.is_active = TRUE
        WHERE d.college_id = ? AND d.is_active = TRUE
        GROUP BY d.id
        ORDER BY d.name ASC`,
        [session.college_id]
      );

      return NextResponse.json({
        success: true,
        departments: departments.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          hodName: dept.hod_name,
          hodEmail: dept.hod_email,
          isActive: dept.is_active,
          studentCount: dept.student_count || 0,
          placedCount: dept.placed_count || 0,
          placementRate: dept.student_count > 0
            ? Math.round((dept.placed_count / dept.student_count) * 100)
            : 0,
          tpo: dept.tpo_id ? {
            id: dept.tpo_id,
            name: dept.tpo_name,
            email: dept.tpo_email,
          } : null,
          createdAt: dept.created_at,
          updatedAt: dept.updated_at,
        })),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[GET /api/admin/departments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

// POST /api/admin/departments - Create a new department (Central TPO only)
export async function POST(req: NextRequest) {
  try {
    const session = await requireCentralTpo();
    console.log("[POST /api/admin/departments] Session:", JSON.stringify(session, null, 2));

    const body = await req.json();
    console.log("[POST /api/admin/departments] Body:", JSON.stringify(body, null, 2));
    const { name, code, hodName, hodEmail } = body;

    if (!name || !code) {
      console.log("[POST /api/admin/departments] Validation failed: missing name or code");
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    // Validate code format (alphanumeric, no spaces)
    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      console.log("[POST /api/admin/departments] Validation failed: invalid code format");
      return NextResponse.json(
        { error: "Code must be alphanumeric (letters, numbers, underscores, hyphens only)" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Check if department code already exists for this college
      const [existing]: any = await connection.execute(
        "SELECT id FROM departments WHERE college_id = ? AND code = ?",
        [session.college_id, code.toUpperCase()]
      );

      if (existing.length > 0) {
        console.log("[POST /api/admin/departments] Validation failed: duplicate code");
        return NextResponse.json(
          { error: "A department with this code already exists" },
          { status: 400 }
        );
      }

      console.log("[POST /api/admin/departments] Creating department with college_id:", session.college_id);
      // Create the department
      const [result]: any = await connection.execute(
        `INSERT INTO departments (college_id, name, code, hod_name, hod_email)
         VALUES (?, ?, ?, ?, ?)`,
        [session.college_id, name.trim(), code.toUpperCase(), hodName?.trim() || null, hodEmail?.trim() || null]
      );

      const departmentId = result.insertId;

      // Fetch the created department
      const [newDept]: any = await connection.execute(
        "SELECT * FROM departments WHERE id = ?",
        [departmentId]
      );

      return NextResponse.json({
        success: true,
        message: "Department created successfully",
        department: {
          id: newDept[0].id,
          name: newDept[0].name,
          code: newDept[0].code,
          hodName: newDept[0].hod_name,
          hodEmail: newDept[0].hod_email,
          isActive: newDept[0].is_active,
          createdAt: newDept[0].created_at,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[POST /api/admin/departments] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
