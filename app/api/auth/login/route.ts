import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  collegeToken: z.string().min(1, 'College token is required')
});

export async function POST(request: NextRequest) {
  // Rate Limit
  if (!checkRateLimit(request, 5, 60000)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let connection;
  try {
    const body = await request.json();

    // Zod Validation
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, collegeToken } = validation.data;

    connection = await pool.getConnection();

    // Get student by email
    const [students] = await connection.execute(
      `SELECT student_id, first_name, last_name, email, password_hash, college_token
       FROM Students 
       WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    if (!Array.isArray(students) || (students as any).length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const student = (students as any[])[0];

    // Verify college token
    if (student.college_token !== collegeToken) {
      return NextResponse.json(
        { error: 'Invalid college token' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Remove sensitive data before sending response
    const { password_hash, college_token, ...studentData } = student;

    // Create JWT session
    const token = jwt.sign(
      {
        id: student.student_id,
        role: 'student'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectTo: '/dashboard' // Removed token query param
    });

    // Set secure opaque session cookie
    response.cookies.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400
    });

    // Clear legacy cookies
    response.cookies.delete('studentData');

    return response;

  } catch (error) {
    console.error('Student login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
