import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireCentralTpo } from "@/lib/tpo-auth";

// GET /api/admin/departments/[id] - Get single department details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [departments]: any = await connection.execute(
        `SELECT
          d.*,
          COUNT(DISTINCT s.student_id) as student_count,
          COUNT(DISTINCT CASE WHEN s.placement_status = 'placed' THEN s.student_id END) as placed_count,
          AVG(s.current_gpa) as avg_gpa,
          tu.id as tpo_id,
          tu.name as tpo_name,
          tu.email as tpo_email,
          tu.designation as tpo_designation
        FROM departments d
        LEFT JOIN students s ON s.department_id = d.id AND s.is_active = TRUE
        LEFT JOIN tpo_users tu ON tu.department_id = d.id AND tu.is_active = TRUE
        WHERE d.id = ? AND d.college_id = ?
        GROUP BY d.id`,
        [departmentId, session.college_id]
      );

      if (departments.length === 0) {
        return NextResponse.json({ error: "Department not found" }, { status: 404 });
      }

      const dept = departments[0];

      return NextResponse.json({
        success: true,
        department: {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          hodName: dept.hod_name,
          hodEmail: dept.hod_email,
          isActive: dept.is_active,
          studentCount: dept.student_count || 0,
          placedCount: dept.placed_count || 0,
          avgGpa: dept.avg_gpa ? parseFloat(dept.avg_gpa).toFixed(2) : null,
          placementRate: dept.student_count > 0
            ? Math.round((dept.placed_count / dept.student_count) * 100)
            : 0,
          tpo: dept.tpo_id ? {
            id: dept.tpo_id,
            name: dept.tpo_name,
            email: dept.tpo_email,
            designation: dept.tpo_designation,
          } : null,
          createdAt: dept.created_at,
          updatedAt: dept.updated_at,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[GET /api/admin/departments/[id]] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/departments/[id] - Update department (Central TPO only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, code, hodName, hodEmail, isActive } = body;

    const connection = await pool.getConnection();

    try {
      // Check if department exists and belongs to this college
      const [existing]: any = await connection.execute(
        "SELECT id FROM departments WHERE id = ? AND college_id = ?",
        [departmentId, session.college_id]
      );

      if (existing.length === 0) {
        return NextResponse.json({ error: "Department not found" }, { status: 404 });
      }

      // If code is being changed, check for duplicates
      if (code) {
        const [duplicate]: any = await connection.execute(
          "SELECT id FROM departments WHERE college_id = ? AND code = ? AND id != ?",
          [session.college_id, code.toUpperCase(), departmentId]
        );

        if (duplicate.length > 0) {
          return NextResponse.json(
            { error: "A department with this code already exists" },
            { status: 400 }
          );
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push("name = ?");
        values.push(name.trim());
      }
      if (code !== undefined) {
        updates.push("code = ?");
        values.push(code.toUpperCase());
      }
      if (hodName !== undefined) {
        updates.push("hod_name = ?");
        values.push(hodName?.trim() || null);
      }
      if (hodEmail !== undefined) {
        updates.push("hod_email = ?");
        values.push(hodEmail?.trim() || null);
      }
      if (isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(isActive);
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        );
      }

      values.push(departmentId);

      await connection.execute(
        `UPDATE departments SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Fetch updated department
      const [updated]: any = await connection.execute(
        "SELECT * FROM departments WHERE id = ?",
        [departmentId]
      );

      return NextResponse.json({
        success: true,
        message: "Department updated successfully",
        department: {
          id: updated[0].id,
          name: updated[0].name,
          code: updated[0].code,
          hodName: updated[0].hod_name,
          hodEmail: updated[0].hod_email,
          isActive: updated[0].is_active,
          updatedAt: updated[0].updated_at,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[PUT /api/admin/departments/[id]] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/departments/[id] - Soft delete department (Central TPO only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Check if department exists and belongs to this college
      const [existing]: any = await connection.execute(
        "SELECT id, name FROM departments WHERE id = ? AND college_id = ?",
        [departmentId, session.college_id]
      );

      if (existing.length === 0) {
        return NextResponse.json({ error: "Department not found" }, { status: 404 });
      }

      // Soft delete - set is_active to false
      await connection.execute(
        "UPDATE departments SET is_active = FALSE WHERE id = ?",
        [departmentId]
      );

      // Also deactivate any TPO users assigned to this department
      await connection.execute(
        "UPDATE tpo_users SET is_active = FALSE WHERE department_id = ?",
        [departmentId]
      );

      return NextResponse.json({
        success: true,
        message: `Department "${existing[0].name}" has been deactivated`,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/admin/departments/[id]] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
