// app/api/student/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Get cookies
    const cookieStore = req.cookies
    const collegeCookie = cookieStore.get('collegeData')?.value

    if (!collegeCookie) {
      return NextResponse.json({ error: 'College ID not found in cookies' }, { status: 400 })
    }

    const college = JSON.parse(collegeCookie)
    const collegeId = college.id

    if (!collegeId) {
      return NextResponse.json({ error: 'Invalid college data in cookie' }, { status: 400 })
    }

    // Query students for this college
    const [rows] = await pool.query(
      `SELECT 
        student_id,
        first_name,
        last_name,
        email,
        phone,
        college,
        department,
        program,
        current_year,
        current_semester,
        current_gpa,
        gender,
        enrollment_year,
        date_of_birth,
        location_preference,
        industry_focus,
        intensity_level,
        is_active,
        created_at,
        updated_at
      FROM Students
      WHERE college_id = ?`,
      [collegeId]
    )

    return NextResponse.json({ success: true, students: rows })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
