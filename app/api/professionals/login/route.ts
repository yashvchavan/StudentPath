import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const connection = await pool.getConnection();

    // ✅ Find professional with full profile data
    const [rows] = await connection.execute(
      `SELECT id, password_hash, first_name, last_name, email, company, designation, industry, experience
       FROM professionals WHERE email = ? AND is_active = 1`,
      [email]
    );

    connection.release();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const professional = (rows as any)[0];

    // ✅ Compare password
    const match = await bcrypt.compare(password, professional.password_hash);
    if (!match) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ✅ Create professionalData for cookie
    const professionalData = {
      id: professional.id,
      first_name: professional.first_name,
      last_name: professional.last_name,
      email: professional.email,
      company: professional.company || "",
      designation: professional.designation || "",
      isAuthenticated: true,
      isAdmin: false,
      userType: "professional",
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

    // ✅ Set professionalData cookie (24 hours)
    response.cookies.set("professionalData", JSON.stringify(professionalData), {
      path: "/",
      maxAge: 86400,
      sameSite: "strict",
      httpOnly: false, // Allow client-side access
    });

    // ✅ Clear conflicting cookies
    response.cookies.delete("studentData");
    response.cookies.delete("collegeData");

    return response;
  } catch (error) {
    console.error("Professional login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
