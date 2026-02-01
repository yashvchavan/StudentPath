import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  let connection;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
      // Invalid token
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const { id: userId, role: userType } = decoded;

    if (!userId || !userType) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Connect to DB to verify and get fresh data
    connection = await pool.getConnection();
    let dbUser: any = null;

    if (userType === 'college') {
      const [rows]: any = await connection.execute(
        'SELECT id, college_name, email, logo_url, is_active FROM colleges WHERE id = ?',
        [userId]
      );
      if (rows.length > 0) dbUser = rows[0];
    } else if (userType === 'professional') {
      const [rows]: any = await connection.execute(
        'SELECT id, first_name, last_name, email, is_active FROM professionals WHERE id = ?',
        [userId]
      );
      if (rows.length > 0) dbUser = rows[0];
    } else if (userType === 'student') {
      const [rows]: any = await connection.execute(
        'SELECT student_id, first_name, last_name, email, is_active, college_token FROM Students WHERE student_id = ?',
        [userId]
      );
      if (rows.length > 0) dbUser = rows[0];
    }

    if (!dbUser || !dbUser.is_active) {
      return NextResponse.json({ authenticated: false, error: 'User inactive or not found' }, { status: 200 });
    }

    // Construct safe response
    const userData = {
      id: userType === 'student' ? dbUser.student_id : dbUser.id,
      role: userType,
      name: userType === 'college' ? dbUser.college_name : `${dbUser.first_name} ${dbUser.last_name}`,
      email: dbUser.email,
      ...(userType === 'college' ? { logo_url: dbUser.logo_url } : {}),
      // We might need to return college_token for student if the frontend uses it, 
      // but the requirement says cookies are opaque. We return data in JSON.
      ...(userType === 'student' ? { college_token: dbUser.college_token } : {})
    };

    return NextResponse.json({
      authenticated: true,
      user: userData
    });

  } catch (error) {
    console.error('Auth Check Error:', error);
    return NextResponse.json({ authenticated: false, error: 'Server error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
