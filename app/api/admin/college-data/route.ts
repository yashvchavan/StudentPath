// app/api/admin/college-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

interface StudentRow extends RowDataPacket {
  student_id: number
  first_name: string
  last_name: string
  email: string
  program?: string
  is_active?: number
  created_at: string
}

interface StatsRow extends RowDataPacket {
  total_students: number
  active_students: number
}

interface ProgramRow extends RowDataPacket {
  program: string
}

interface TokenUsageRow extends RowDataPacket {
  usage_count: number
}

interface DepartmentRow extends RowDataPacket {
  program: string
  count: number
}

import jwt from 'jsonwebtoken'

// ...

export async function GET(req: NextRequest) {
  try {
    // Get college data from cookies
    const cookieStore = req.cookies
    const token = cookieStore.get('auth_session')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - College authentication required'
      }, { status: 401 })
    }

    let collegeToken: string | undefined;
    let collegeId: number | undefined;
    let collegeName: string | undefined;
    let collegeEmail: string | undefined;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
      if (decoded.role === 'college') {
        collegeId = decoded.id;
        // Fetch token directly from DB
        const [rows]: any = await pool.query('SELECT college_token, college_name, email FROM colleges WHERE id = ?', [collegeId]);
        if (rows.length > 0) {
          collegeToken = rows[0].college_token;
          collegeName = rows[0].college_name;
          collegeEmail = rows[0].email;
        }
      }
    } catch (e) {
      console.error("Session parse error", e);
    }

    if (!collegeToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid college session'
      }, { status: 401 })
    }

    // 1. Get total and active students count
    const [statsRows] = await pool.query<StatsRow[]>(
      `SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_students
      FROM Students
      WHERE college_token = ?`,
      [collegeToken]
    )

    const stats = statsRows[0]

    // 2. Get unique programs (departments) from Students table
    const [programRows] = await pool.query<ProgramRow[]>(
      `SELECT DISTINCT program 
      FROM Students
      WHERE college_token = ? AND program IS NOT NULL AND program != ''
      ORDER BY program`,
      [collegeToken]
    )

    const programs = programRows.map(row => row.program)

    // 3. Get recent registrations (last 10 students) with program from Students table
    const [recentRows] = await pool.query<StudentRow[]>(
      `SELECT 
        student_id,
        first_name,
        last_name,
        email,
        program,
        created_at
      FROM Students
      WHERE college_token = ?
      ORDER BY created_at DESC
      LIMIT 10`,
      [collegeToken]
    )

    const recentRegistrations = recentRows.map(student => ({
      id: student.student_id,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      program: student.program || 'Not Set',
      created_at: student.created_at,
      date: new Date(student.created_at).toLocaleDateString()
    }))

    // 4. Get token usage for current month
    const [tokenUsageRows] = await pool.query<TokenUsageRow[]>(
      `SELECT COUNT(*) as usage_count
      FROM Students
      WHERE college_token = ? 
      AND MONTH(created_at) = MONTH(CURRENT_DATE())
      AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
      [collegeToken]
    )

    const tokenUsage = {
      usageCount: tokenUsageRows[0]?.usage_count || 0,
      maxUsage: 1000, // You can make this dynamic if stored in database
      remaining: 1000 - (tokenUsageRows[0]?.usage_count || 0),
      isActive: true
    }

    // 5. Get department distribution from Students table
    const [deptRows] = await pool.query<DepartmentRow[]>(
      `SELECT 
        program,
        COUNT(*) as count
      FROM Students
      WHERE college_token = ? AND program IS NOT NULL AND program != ''
      GROUP BY program
      ORDER BY count DESC`,
      [collegeToken]
    )

    const departmentStats = deptRows.map(row => ({
      department: row.program,
      count: row.count
    }))

    console.log('API: Successfully fetched college data')

    return NextResponse.json({
      success: true,
      totalStudents: Number(stats.total_students),
      activeStudents: Number(stats.active_students),
      programs,
      recentRegistrations,
      tokenUsage,
      departmentStats,
      collegeInfo: {
        id: collegeId,
        name: collegeName,
        email: collegeEmail,
        token: collegeToken
      }
    })

  } catch (error) {
    console.error('Error fetching college data:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}