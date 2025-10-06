import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      designation,
      industry,
      experience,
      currentSalary,
      expectedSalary,
      linkedin,
      github,
      portfolio,
      password,
      skills,
      certifications,
      careerGoals,
      preferredLearningStyle
    } = body;

    // ✅ Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    // ✅ Check if email exists
    const [existing] = await connection.execute(
      "SELECT id FROM professionals WHERE email = ?",
      [email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      connection.release();
      return NextResponse.json(
        { error: "Professional with this email already exists" },
        { status: 409 }
      );
    }

    // ✅ Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // ✅ Insert new professional
    const [result] = await connection.execute(
      `INSERT INTO professionals (
        first_name, last_name, email, phone, company, designation, industry,
        experience, current_salary, expected_salary, linkedin, github, portfolio,
        password_hash, skills, certifications, career_goals, preferred_learning_style,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        firstName,
        lastName,
        email,
        phone || null,
        company || null,
        designation || null,
        industry || null,
        experience || null,
        currentSalary || null,
        expectedSalary || null,
        linkedin || null,
        github || null,
        portfolio || null,
        passwordHash,
        JSON.stringify(skills || []),
        certifications || null,
        careerGoals || null,
        preferredLearningStyle || null
      ]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      message: "Professional registered successfully",
      professionalId: (result as any).insertId
    });
  } catch (error) {
    console.error("Professional registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
