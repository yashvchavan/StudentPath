import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  requireCentralTpo,
  generateInviteToken,
  DEFAULT_DEPT_TPO_PERMISSIONS,
  TPO_PERMISSIONS,
  TpoPermission,
} from "@/lib/tpo-auth";
import { sendDeptTpoInviteEmail } from "@/lib/email";

// GET /api/admin/tpo-users - List all TPO users for the college
export async function GET(req: NextRequest) {
  try {
    const session = await requireCentralTpo();

    const connection = await pool.getConnection();

    try {
      // Get all TPO users with department info
      const [tpoUsers]: any = await connection.execute(
        `SELECT
          tu.*,
          d.name as department_name,
          d.code as department_code
        FROM tpo_users tu
        LEFT JOIN departments d ON tu.department_id = d.id
        WHERE tu.college_id = ?
        ORDER BY tu.created_at DESC`,
        [session.college_id]
      );

      // Get pending invites
      const [pendingInvites]: any = await connection.execute(
        `SELECT
          ti.*,
          d.name as department_name,
          d.code as department_code
        FROM tpo_invites ti
        LEFT JOIN departments d ON ti.department_id = d.id
        WHERE ti.college_id = ? AND ti.accepted_at IS NULL AND ti.expires_at > NOW()
        ORDER BY ti.created_at DESC`,
        [session.college_id]
      );

      return NextResponse.json({
        success: true,
        tpoUsers: tpoUsers.map((user: any) => ({
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
        })),
        pendingInvites: pendingInvites.map((invite: any) => ({
          id: invite.id,
          email: invite.email,
          name: invite.name,
          designation: invite.designation,
          departmentId: invite.department_id,
          departmentName: invite.department_name,
          departmentCode: invite.department_code,
          permissions: parsePermissions(invite.permissions),
          expiresAt: invite.expires_at,
          createdAt: invite.created_at,
        })),
        availablePermissions: Object.entries(TPO_PERMISSIONS).map(([key, value]) => ({
          key,
          value,
          label: formatPermissionLabel(value),
        })),
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[GET /api/admin/tpo-users] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch TPO users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/tpo-users - Invite a new TPO user (Central TPO only)
export async function POST(req: NextRequest) {
  try {
    const session = await requireCentralTpo();
    console.log("[POST /api/admin/tpo-users] Session:", JSON.stringify(session, null, 2));

    const body = await req.json();
    console.log("[POST /api/admin/tpo-users] Body:", JSON.stringify(body, null, 2));
    const { email, name, designation, departmentId, permissions } = body;

    if (!email || !name) {
      console.log("[POST /api/admin/tpo-users] Validation failed: missing email or name");
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("[POST /api/admin/tpo-users] Validation failed: invalid email format");
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate permissions if provided
    const validPermissions = permissions && Array.isArray(permissions)
      ? permissions.filter((p: string) => Object.values(TPO_PERMISSIONS).includes(p as TpoPermission))
      : DEFAULT_DEPT_TPO_PERMISSIONS;

    console.log("[POST /api/admin/tpo-users] Valid permissions:", validPermissions);

    const connection = await pool.getConnection();

    try {
      // Check if email already exists as TPO user
      const [existingUser]: any = await connection.execute(
        "SELECT id FROM tpo_users WHERE email = ?",
        [email.toLowerCase()]
      );

      if (existingUser.length > 0) {
        console.log("[POST /api/admin/tpo-users] Validation failed: TPO user already exists");
        return NextResponse.json(
          { error: "A TPO user with this email already exists" },
          { status: 400 }
        );
      }

      // Check if there's a pending invite for this email
      const [existingInvite]: any = await connection.execute(
        "SELECT id FROM tpo_invites WHERE email = ? AND accepted_at IS NULL AND expires_at > NOW()",
        [email.toLowerCase()]
      );

      if (existingInvite.length > 0) {
        console.log("[POST /api/admin/tpo-users] Validation failed: pending invite exists");
        return NextResponse.json(
          { error: "A pending invite already exists for this email" },
          { status: 400 }
        );
      }

      let departmentName: string | null = null;

      // If departmentId is provided, verify it belongs to this college
      if (departmentId) {
        const [dept]: any = await connection.execute(
          "SELECT id, name FROM departments WHERE id = ? AND college_id = ? AND is_active = TRUE",
          [departmentId, session.college_id]
        );

        if (dept.length === 0) {
          return NextResponse.json(
            { error: "Invalid department" },
            { status: 400 }
          );
        }

        departmentName = dept[0].name;
      }

      // Generate invite token
      const token = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create invite
      const [result]: any = await connection.execute(
        `INSERT INTO tpo_invites (college_id, department_id, email, name, designation, permissions, token, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.college_id,
          departmentId || null,
          email.toLowerCase().trim(),
          name.trim(),
          designation?.trim() || null,
          JSON.stringify(validPermissions),
          token,
          expiresAt,
        ]
      );

      // Generate invite URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const inviteUrl = `${baseUrl}/auth/accept-invite?token=${token}`;

      // Send invite email with password setup link. Roll back invite if sending fails.
      try {
        await sendDeptTpoInviteEmail({
          to: email.toLowerCase().trim(),
          name: name.trim(),
          collegeName: session.name,
          inviteUrl,
          expiresAt,
          departmentName,
          invitedByName: session.name,
        });
      } catch (mailError) {
        console.error("[POST /api/admin/tpo-users] Invite email failed:", mailError);

        const mailMessage = mailError instanceof Error ? mailError.message : "Unknown mail error";
        const isAuthError = /Invalid login|BadCredentials|EAUTH|Username and Password not accepted/i.test(mailMessage);

        return NextResponse.json(
          {
            success: true,
            emailSent: false,
            message: isAuthError
              ? "Invite created, but email delivery failed due to SMTP authentication. Share the fallback link and fix SMTP credentials."
              : "Invite created, but email delivery failed. Share the fallback link and verify SMTP configuration.",
            details: mailMessage,
            invite: {
              id: result.insertId,
              email: email.toLowerCase().trim(),
              name: name.trim(),
              inviteUrl,
              expiresAt,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        message: "Invite email sent successfully",
        invite: {
          id: result.insertId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          expiresAt,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[POST /api/admin/tpo-users] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create invite" },
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

// Helper to format permission labels
function formatPermissionLabel(permission: string): string {
  return permission
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
