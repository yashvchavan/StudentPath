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

    // ✅ Find professional
    const [rows] = await connection.execute(
      "SELECT id, password_hash, first_name, last_name, email FROM professionals WHERE email = ? AND is_active = 1",
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

    // ✅ Return success (replace with JWT/session later if needed)
    return NextResponse.json({
      success: true,
      message: "Login successful",
      professional: {
        id: professional.id,
        firstName: professional.first_name,
        lastName: professional.last_name,
        email: professional.email,
      },
    });
  } catch (error) {
    console.error("Professional login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
