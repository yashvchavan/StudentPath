import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireCentralTpo, TPO_PERMISSIONS, TpoPermission } from "@/lib/tpo-auth";

// GET /api/admin/tpo-users/[id] - Get single TPO user details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [users]: any = await connection.execute(
        `SELECT
          tu.*,
          d.name as department_name,
          d.code as department_code
        FROM tpo_users tu
        LEFT JOIN departments d ON tu.department_id = d.id
        WHERE tu.id = ? AND tu.college_id = ?`,
        [userId, session.college_id]
      );

      if (users.length === 0) {
        return NextResponse.json({ error: "TPO user not found" }, { status: 404 });
      }

      const user = users[0];

      return NextResponse.json({
        success: true,
        tpoUser: {
          id: user.id,
          email: user.email,
          name: user.name,
          designation: user.designation,
          departmentId: user.department_id,
          departmentName: user.department_name,
          departmentCode: user.department_code,
          permissions: parsePermissions(user.permissions),
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[GET /api/admin/tpo-users/[id]] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch TPO user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tpo-users/[id] - Update TPO user (Central TPO only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, designation, departmentId, permissions, isActive } = body;

    const connection = await pool.getConnection();

    try {
      // Check if user exists and belongs to this college
      const [existing]: any = await connection.execute(
        "SELECT id FROM tpo_users WHERE id = ? AND college_id = ?",
        [userId, session.college_id]
      );

      if (existing.length === 0) {
        return NextResponse.json({ error: "TPO user not found" }, { status: 404 });
      }

      // If departmentId is provided, verify it belongs to this college
      if (departmentId !== undefined && departmentId !== null) {
        const [dept]: any = await connection.execute(
          "SELECT id FROM departments WHERE id = ? AND college_id = ? AND is_active = TRUE",
          [departmentId, session.college_id]
        );

        if (dept.length === 0) {
          return NextResponse.json(
            { error: "Invalid department" },
            { status: 400 }
          );
        }
      }

      // Validate permissions if provided
      let validPermissions = undefined;
      if (permissions !== undefined) {
        validPermissions = Array.isArray(permissions)
          ? permissions.filter((p: string) => Object.values(TPO_PERMISSIONS).includes(p as TpoPermission))
          : [];
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push("name = ?");
        values.push(name.trim());
      }
      if (designation !== undefined) {
        updates.push("designation = ?");
        values.push(designation?.trim() || null);
      }
      if (departmentId !== undefined) {
        updates.push("department_id = ?");
        values.push(departmentId || null);
      }
      if (validPermissions !== undefined) {
        updates.push("permissions = ?");
        values.push(JSON.stringify(validPermissions));
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

      values.push(userId);

      await connection.execute(
        `UPDATE tpo_users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Fetch updated user
      const [updated]: any = await connection.execute(
        `SELECT tu.*, d.name as department_name, d.code as department_code
         FROM tpo_users tu
         LEFT JOIN departments d ON tu.department_id = d.id
         WHERE tu.id = ?`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        message: "TPO user updated successfully",
        tpoUser: {
          id: updated[0].id,
          email: updated[0].email,
          name: updated[0].name,
          designation: updated[0].designation,
          departmentId: updated[0].department_id,
          departmentName: updated[0].department_name,
          permissions: parsePermissions(updated[0].permissions),
          isActive: updated[0].is_active,
          updatedAt: updated[0].updated_at,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[PUT /api/admin/tpo-users/[id]] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update TPO user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tpo-users/[id] - Deactivate TPO user (Central TPO only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCentralTpo();
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Check if user exists and belongs to this college
      const [existing]: any = await connection.execute(
        "SELECT id, name, email FROM tpo_users WHERE id = ? AND college_id = ?",
        [userId, session.college_id]
      );

      if (existing.length === 0) {
        return NextResponse.json({ error: "TPO user not found" }, { status: 404 });
      }

      // Soft delete - set is_active to false
      await connection.execute(
        "UPDATE tpo_users SET is_active = FALSE WHERE id = ?",
        [userId]
      );

      return NextResponse.json({
        success: true,
        message: `TPO user "${existing[0].name}" has been deactivated`,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/admin/tpo-users/[id]] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to deactivate TPO user" },
      { status: 500 }
    );
  }
}

// Helper to parse permissions
function parsePermissions(permissions: any): string[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === "string") {
    try {
      return JSON.parse(permissions);
    } catch {
      return [];
    }
  }
  return [];
}
