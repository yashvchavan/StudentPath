import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// POST /api/auth/accept-invite - Accept TPO invite and set password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Find the invite
      const [invites]: any = await connection.execute(
        `SELECT ti.*, d.name as department_name
         FROM tpo_invites ti
         LEFT JOIN departments d ON ti.department_id = d.id
         WHERE ti.token = ? AND ti.accepted_at IS NULL AND ti.expires_at > NOW()`,
        [token]
      );

      if (invites.length === 0) {
        return NextResponse.json(
          { error: "Invalid or expired invite token" },
          { status: 400 }
        );
      }

      const invite = invites[0];

      // Check if email already exists as TPO user
      const [existingUser]: any = await connection.execute(
        "SELECT id FROM tpo_users WHERE email = ?",
        [invite.email]
      );

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create TPO user
      const [result]: any = await connection.execute(
        `INSERT INTO tpo_users (college_id, department_id, email, name, password_hash, designation, permissions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invite.college_id,
          invite.department_id,
          invite.email,
          invite.name,
          passwordHash,
          invite.designation,
          invite.permissions,
        ]
      );

      const userId = result.insertId;

      // Mark invite as accepted
      await connection.execute(
        "UPDATE tpo_invites SET accepted_at = NOW() WHERE id = ?",
        [invite.id]
      );

      // Create JWT token for auto-login
      const jwtToken = jwt.sign(
        { id: userId, role: "dept_tpo" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Create response with auth cookie
      const response = NextResponse.json({
        success: true,
        message: "Account created successfully",
        user: {
          id: userId,
          email: invite.email,
          name: invite.name,
          role: "dept_tpo",
          departmentId: invite.department_id,
          departmentName: invite.department_name,
        },
      });

      // Set auth cookie
      response.cookies.set("auth_session", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[POST /api/auth/accept-invite] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

// GET /api/auth/accept-invite - Validate invite token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      const [invites]: any = await connection.execute(
        `SELECT ti.email, ti.name, ti.designation, d.name as department_name, c.college_name
         FROM tpo_invites ti
         LEFT JOIN departments d ON ti.department_id = d.id
         LEFT JOIN colleges c ON ti.college_id = c.id
         WHERE ti.token = ? AND ti.accepted_at IS NULL AND ti.expires_at > NOW()`,
        [token]
      );

      if (invites.length === 0) {
        return NextResponse.json(
          { error: "Invalid or expired invite token", valid: false },
          { status: 400 }
        );
      }

      const invite = invites[0];

      return NextResponse.json({
        valid: true,
        invite: {
          email: invite.email,
          name: invite.name,
          designation: invite.designation,
          departmentName: invite.department_name,
          collegeName: invite.college_name,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[GET /api/auth/accept-invite] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}
