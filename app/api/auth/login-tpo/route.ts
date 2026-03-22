import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// POST /api/auth/login-tpo - Login for TPO users
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Find TPO user
      const [users]: any = await connection.execute(
        `SELECT tu.*, d.name as department_name, c.college_name, c.logo_url
         FROM tpo_users tu
         LEFT JOIN departments d ON tu.department_id = d.id
         LEFT JOIN colleges c ON tu.college_id = c.id
         WHERE tu.email = ? AND tu.is_active = TRUE`,
        [email.toLowerCase().trim()]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const user = users[0];

      // Verify password
      if (!user.password_hash) {
        return NextResponse.json(
          { error: "Account not yet activated. Please check your invite email." },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Parse permissions
      let permissions: string[] = [];
      if (user.permissions) {
        if (Array.isArray(user.permissions)) {
          permissions = user.permissions;
        } else if (typeof user.permissions === "string") {
          try {
            permissions = JSON.parse(user.permissions);
          } catch {
            permissions = [];
          }
        }
      }

      // Create JWT token
      const jwtToken = jwt.sign(
        { id: user.id, role: "dept_tpo" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Create response
      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: "dept_tpo",
          designation: user.designation,
          collegeId: user.college_id,
          collegeName: user.college_name,
          departmentId: user.department_id,
          departmentName: user.department_name,
          permissions,
          logoUrl: user.logo_url,
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

      // Also set TPO data cookie for client-side access (non-sensitive data only)
      response.cookies.set(
        "tpoData",
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: "dept_tpo",
          collegeName: user.college_name,
          departmentName: user.department_name,
          logoUrl: user.logo_url,
        }),
        {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
          path: "/",
        }
      );

      return response;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[POST /api/auth/login-tpo] Error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
