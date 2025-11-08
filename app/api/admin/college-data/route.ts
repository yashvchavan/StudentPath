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

export async function GET(req: NextRequest) {
  try {
    // Get college data from cookies
    const cookieStore = req.cookies
    const collegeData = cookieStore.get('collegeData')?.value
    
    console.log('API: College cookie exists:', !!collegeData)
    
    if (!collegeData) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - College authentication required' 
      }, { status: 401 })
    }

    const college = JSON.parse(collegeData)
    console.log('API: Parsed college data:', { id: college.id, type: college.type })
    
    const collegeToken = college.token

    if (!collegeToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid college ID' 
      }, { status: 400 })
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

    // 2. Get unique programs (departments) from academic_profiles
    const [programRows] = await pool.query<ProgramRow[]>(
      `SELECT DISTINCT ap.program 
      FROM academic_profiles ap
      INNER JOIN Students s ON ap.student_id = s.student_id
      WHERE s.college_token = ? AND ap.program IS NOT NULL AND ap.program != ''
      ORDER BY ap.program`,
      [collegeToken]
    )
    
    const programs = programRows.map(row => row.program)

    // 3. Get recent registrations (last 10 students) with program from academic_profiles
    const [recentRows] = await pool.query<StudentRow[]>(
      `SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        ap.program,
        s.created_at
      FROM Students s
      LEFT JOIN academic_profiles ap ON s.student_id = ap.student_id
      WHERE s.college_token = ?
      ORDER BY s.created_at DESC
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

    // 5. Get department distribution from academic_profiles
    const [deptRows] = await pool.query<DepartmentRow[]>(
      `SELECT 
        ap.program,
        COUNT(*) as count
      FROM academic_profiles ap
      INNER JOIN Students s ON ap.student_id = s.student_id
      WHERE s.college_token = ? AND ap.program IS NOT NULL AND ap.program != ''
      GROUP BY ap.program
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
        id: college.id,
        name: college.name,
        email: college.email,
        token: college.token
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