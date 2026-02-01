import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import pool from "@/lib/db";

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  // Rate Limit
  if (!checkRateLimit(request, 5, 60000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  let connection;
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = validation.data;

    connection = await pool.getConnection();

    // ✅ Find professional with full profile data
    const [rows] = await connection.execute(
      `SELECT id, password_hash, first_name, last_name, email, company, designation, industry, experience
       FROM professionals WHERE email = ? AND is_active = 1`,
      [email]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const professional = (rows as any)[0];

    // ✅ Compare password
    const match = await bcrypt.compare(password, professional.password_hash);
    if (!match) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ✅ Create session token
    const token = jwt.sign(
      { id: professional.id, role: 'professional' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // ✅ Create session data for cookie (minimal & opaque-ish)
    const sessionData = {
      sessionId: token,
      role: 'professional',
      isAuthenticated: true,
      timestamp: Date.now(),
    };

    // ✅ Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      professional: {
        id: professional.id,
        firstName: professional.first_name,
        lastName: professional.last_name,
        email: professional.email,
        company: professional.company,
        designation: professional.designation,
      },
    });

    // ✅ Set opaque auth_session cookie (24 hours, httpOnly)
    response.cookies.set("auth_session", token, {
      path: "/",
      maxAge: 86400,
      sameSite: "strict",
      httpOnly: true, // Secure: Client cannot read this
      secure: process.env.NODE_ENV === 'production',
    });

    // ✅ Clear legacy cookies
    response.cookies.delete("professionalData");
    response.cookies.delete("studentData");
    response.cookies.delete("collegeData");

    return response;
  } catch (error) {
    console.error("Professional login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
