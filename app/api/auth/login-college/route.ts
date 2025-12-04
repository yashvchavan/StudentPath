import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { CollegeRow } from '@/lib/db-types';

interface LoginCollegeRow extends CollegeRow {
  password_hash: string;
}

export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // ✅ Correct destructuring
    const [rows] = await connection.execute<LoginCollegeRow[]>(
      'SELECT id, college_name, email, password_hash, college_token, is_active FROM colleges WHERE email = ?',
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
    const cookieOptions = {
      httpOnly: true,
      secure: false,        // ❗ Must be FALSE for http://
      sameSite: 'strict' as const,
      path: '/'
    };


    response.cookies.set(
      'collegeData',
      JSON.stringify({
        id: college.id,
        name: college.college_name,
        email: college.email,
        token: college.college_token,
        type: 'college'
      }),
      cookieOptions
    );

    response.cookies.set('authToken', college.college_token, cookieOptions);

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
