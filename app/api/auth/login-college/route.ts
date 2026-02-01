import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { CollegeRow } from '@/lib/db-types';

interface LoginCollegeRow extends CollegeRow {
  password_hash: string;
}

import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

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

    // ✅ Correct destructuring
    const [rows] = await connection.execute<LoginCollegeRow[]>(
      'SELECT id, college_name, email, password_hash, college_token, is_active, logo_url FROM colleges WHERE email = ?',
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const college = rows[0];

    if (!college.is_active) {
      return NextResponse.json(
        { error: 'College account is inactive' },
        { status: 403 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, college.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ✅ Prepare JSON response
    const response = NextResponse.json({
      success: true,
      college: {
        id: college.id,
        name: college.college_name,
        email: college.email,
        token: college.college_token
      }
    });



    // ✅ Set secure cookies properly
    // ✅ Set secure opaque session cookie
    const sessionToken = jwt.sign(
      { id: college.id, role: 'college' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const sessionCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 86400 // 24 hours
    };

    response.cookies.set(
      'auth_session',
      sessionToken,
      sessionCookieOptions
    );

    // Clear legacy cookies
    response.cookies.delete('collegeData');
    response.cookies.delete('authToken');

    return response;

  } catch (error) {
    console.error('College login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
