import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

// Helper to parse permissions from various formats
function parsePermissions(permissions: any): string[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === "string") {
    // Handle comma-separated string
    if (permissions.includes(',')) {
      return permissions.split(',').map(p => p.trim()).filter(p => p);
    }
    // Handle single permission
    if (permissions.trim() && !permissions.startsWith('[') && !permissions.startsWith('{')) {
      return [permissions.trim()];
    }
    // Try JSON parse as fallback
    try {
      return JSON.parse(permissions);
    } catch {
      return [];
    }
  }
  return [];
}

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
    } else if (userType === 'dept_tpo') {
      const [rows]: any = await connection.execute(
        `SELECT tu.id, tu.name, tu.email, tu.designation, tu.college_id, tu.department_id, tu.permissions, tu.is_active,
                d.name as department_name, d.code as department_code
         FROM tpo_users tu
         LEFT JOIN departments d ON tu.department_id = d.id
         WHERE tu.id = ?`,
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
        `SELECT student_id, first_name, last_name, email, phone, is_active, college_token,
                program, current_year, current_semester, enrollment_year, current_gpa,
                prn, date_of_birth, gender, country,
                github_username, leetcode_username, linkedin_url,
                primary_goal, secondary_goal, timeline, location_preference,
                academic_interests, technical_skills, soft_skills, language_skills, industry_focus
         FROM Students WHERE student_id = ? AND is_active = TRUE`,
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
      name: userType === 'college'
        ? dbUser.college_name
        : userType === 'dept_tpo'
        ? dbUser.name
        : `${dbUser.first_name} ${dbUser.last_name}`,
      email: dbUser.email,
      ...(userType === 'college' ? { logo_url: dbUser.logo_url } : {}),
      ...(userType === 'dept_tpo' ? {
        department_id: dbUser.department_id,
        departmentId: dbUser.department_id,
        departmentName: dbUser.department_name,
        departmentCode: dbUser.department_code,
        designation: dbUser.designation,
        college_id: dbUser.college_id,
        permissions: parsePermissions(dbUser.permissions)
      } : {}),
      ...(userType === 'student' ? {
        college_token: dbUser.college_token,
        phone: dbUser.phone,
        prn: dbUser.prn,
        date_of_birth: dbUser.date_of_birth,
        gender: dbUser.gender,
        country: dbUser.country,
        program: dbUser.program,
        current_year: dbUser.current_year,
        current_semester: dbUser.current_semester,
        enrollment_year: dbUser.enrollment_year,
        current_gpa: dbUser.current_gpa,
        github_username: dbUser.github_username,
        leetcode_username: dbUser.leetcode_username,
        linkedin_url: dbUser.linkedin_url,
        primary_goal: dbUser.primary_goal,
        secondary_goal: dbUser.secondary_goal,
        timeline: dbUser.timeline,
        location_preference: dbUser.location_preference,
      } : {})
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
