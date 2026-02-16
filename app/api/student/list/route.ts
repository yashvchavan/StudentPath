// app/api/student/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

interface StudentRow extends RowDataPacket {
  student_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  gender?: string
  date_of_birth?: string
  country?: string
  college_token?: string
  is_active?: number
  created_at: string
  updated_at?: string
  // From academic_profiles
  program?: string
  current_year?: number
  current_semester?: number
  enrollment_year?: number
  current_gpa?: number
  // From career_goals
  primary_goal?: string
  secondary_goal?: string
  timeline?: string
  location_preference?: string
  intensity_level?: string
  // Aggregated data
  total_skills?: number
}

interface AcademicInterestRow extends RowDataPacket {
  student_id: number
  interests: string
}

import jwt from 'jsonwebtoken'

// ... (GET handler)
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
    let collegeName: string | undefined;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
      if (decoded.role === 'college') {
        const [rows]: any = await pool.query('SELECT college_token, college_name FROM colleges WHERE id = ?', [decoded.id]);
        if (rows.length > 0) {
          collegeToken = rows[0].college_token;
          collegeName = rows[0].college_name;
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

    console.log('Fetching students for college_token:', collegeToken)

    // Main query to get students with all data from Students table directly
    const [rows] = await pool.query<StudentRow[]>(
      `SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.gender,
        s.date_of_birth,
        s.country,
        s.college_token,
        s.is_active,
        s.created_at,
        s.updated_at,
        s.program,
        s.current_year,
        s.current_semester,
        s.enrollment_year,
        s.current_gpa,
        s.primary_goal,
        s.secondary_goal,
        s.timeline,
        s.location_preference,
        s.intensity_level,
        s.academic_interests,
        s.technical_skills
      FROM Students s
      WHERE s.college_token = ?
      ORDER BY s.created_at DESC`,
      [collegeToken]
    )

    console.log(`Found ${rows.length} students`)

    // Parse JSON fields and build interests map
    const safeJsonParse = (value: any, fallback: any = {}) => {
      if (!value) return fallback;
      if (typeof value === 'object') return value;
      try { return JSON.parse(value); } catch { return fallback; }
    };

    // Format the response - FLAT structure for easy access
    const students = rows.map(student => {
      const interests = safeJsonParse((student as any).academic_interests, []);
      const interestsStr = Array.isArray(interests) ? interests.join(', ') : null;
      const skills = safeJsonParse((student as any).technical_skills, {});
      const totalSkills = Object.keys(skills).length;

      return {
        // Basic Info
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        full_name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        phone: student.phone || null,
        gender: student.gender || null,
        date_of_birth: student.date_of_birth || null,
        country: student.country || null,
        college_token: student.college_token,
        is_active: student.is_active === 1,
        created_at: student.created_at,
        updated_at: student.updated_at,

        // Academic Information - FLAT
        program: student.program || null,
        department: student.program || null, // Alias for backward compatibility
        current_year: student.current_year || null,
        current_semester: student.current_semester || null,
        enrollment_year: student.enrollment_year || null,
        current_gpa: student.current_gpa ? Number(student.current_gpa) : null,
        academic_interests: interestsStr,

        // Career Goals - FLAT
        primary_goal: student.primary_goal || null,
        secondary_goal: student.secondary_goal || null,
        timeline: student.timeline || null,
        location_preference: student.location_preference || null,
        intensity_level: student.intensity_level || null,

        // Stats
        total_skills: totalSkills,
        profile_completion: calculateProfileCompletion(student, interestsStr),

        // Formatted display fields
        year_display: student.current_year ? `Year ${student.current_year}` : 'Not Set',
        gpa_display: student.current_gpa ? Number(student.current_gpa).toFixed(2) : 'N/A',
        program_display: student.program || 'Not Set',
        status_display: student.is_active === 1 ? 'Active' : 'Inactive'
      }
    })

    console.log(`Successfully formatted ${students.length} students`)
    console.log('Sample student:', students[0]) // Debug log

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
      collegeInfo: {
        token: collegeToken,
        name: collegeName
      }
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(student: StudentRow, interests?: string | null): number {
  let completedFields = 0
  const totalFields = 10 // Total important fields to check

  // Basic info (always complete from registration)
  if (student.first_name) completedFields++
  if (student.email) completedFields++

  // Academic profile
  if (student.program) completedFields++
  if (student.current_year) completedFields++
  if (student.current_gpa) completedFields++
  if (interests && interests.length > 0) completedFields++

  // Career goals
  if (student.primary_goal) completedFields++
  if (student.timeline) completedFields++
  if (student.location_preference) completedFields++
  if (student.intensity_level) completedFields++

  return Math.round((completedFields / totalFields) * 100)
}

// Add OPTIONS for CORS if needed
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200 })
}