import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, collegeToken } = body;

    // Validate required fields
    if (!email || !password || !collegeToken) {
      return NextResponse.json(
        { error: 'Email, password, and college token are required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    // Get student by email
    const [students] = await connection.execute(
      `SELECT student_id, first_name, last_name, email, password_hash, college_token
       FROM Students 
       WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    if (!Array.isArray(students) || (students as any).length === 0) {
      connection.release();
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const student = (students as any[])[0];

    // Verify college token
    if (student.college_token !== collegeToken) {
      connection.release();
      return NextResponse.json(
        { error: 'Invalid college token' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password_hash);
    if (!isPasswordValid) {
      connection.release();
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    connection.release();

    // Remove sensitive data before sending response
    const { password_hash, college_token, ...studentData } = student;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectTo: `/dashboard?token=${collegeToken}`,
      student: studentData
    });
    
  } catch (error) {
    console.error('Student login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
