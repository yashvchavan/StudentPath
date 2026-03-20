import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireCentralTpo } from "@/lib/tpo-auth";
import { sendDeptTpoInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await requireCentralTpo();
    const body = await req.json();
    const inviteId = Number(body?.inviteId);

    if (!inviteId || Number.isNaN(inviteId)) {
      return NextResponse.json({ error: "Valid inviteId is required" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [rows]: any = await connection.execute(
        `SELECT
          ti.id,
          ti.email,
          ti.name,
          ti.token,
          ti.expires_at,
          d.name as department_name
         FROM tpo_invites ti
         LEFT JOIN departments d ON ti.department_id = d.id
         WHERE ti.id = ?
           AND ti.college_id = ?
           AND ti.accepted_at IS NULL`,
        [inviteId, session.college_id]
      );

      if (!rows.length) {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      }

      const invite = rows[0];
      const expiresAt = new Date(invite.expires_at);

      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { error: "Invite has expired. Please create a new invite." },
          { status: 400 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const inviteUrl = `${baseUrl}/auth/accept-invite?token=${invite.token}`;

      try {
        await sendDeptTpoInviteEmail({
          to: invite.email,
          name: invite.name,
          collegeName: session.name,
          inviteUrl,
          expiresAt,
          departmentName: invite.department_name,
          invitedByName: session.name,
        });
      } catch (mailError) {
        const mailMessage = mailError instanceof Error ? mailError.message : "Unknown mail error";
        const isAuthError = /Invalid login|BadCredentials|EAUTH|Username and Password not accepted/i.test(mailMessage);

        return NextResponse.json(
          {
            success: true,
            emailSent: false,
            message: isAuthError
              ? "Resend failed due to SMTP authentication. Share the fallback link and fix SMTP credentials."
              : "Resend failed. Share the fallback link and verify SMTP configuration.",
            details: mailMessage,
            invite: {
              id: invite.id,
              email: invite.email,
              name: invite.name,
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
        message: "Invite email resent successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("[POST /api/admin/tpo-users/resend-invite] Error:", error);
    if (error.message === "Unauthorized - Central TPO access required") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to resend invite" }, { status: 500 });
  }
}
