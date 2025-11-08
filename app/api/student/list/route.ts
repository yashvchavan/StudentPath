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

export async function GET(req: NextRequest) {
  try {
    // Get college data from cookies
    const cookieStore = req.cookies
    let collegeData = cookieStore.get('collegeData')?.value
    
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

    console.log('Fetching students for college_token:', collegeToken)

    // Main query to get students with all related data
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
        -- From academic_profiles
        ap.program,
        ap.currentYear as current_year,
        ap.currentSemester as current_semester,
        ap.enrollmentYear as enrollment_year,
        ap.currentGPA as current_gpa,
        -- From career_goals
        cg.primaryGoal as primary_goal,
        cg.secondaryGoal as secondary_goal,
        cg.timeline,
        cg.locationPreference as location_preference,
        cg.intensityLevel as intensity_level,
        -- Count total skills
        (SELECT COUNT(*) FROM skills sk WHERE sk.student_id = s.student_id) as total_skills
      FROM Students s
      LEFT JOIN academic_profiles ap ON s.student_id = ap.student_id
      LEFT JOIN career_goals cg ON s.student_id = cg.student_id
      WHERE s.college_token = ?
      ORDER BY s.created_at DESC`,
      [collegeToken]
    )

    console.log(`Found ${rows.length} students`)

    // Get academic interests for all students in a single query
    const studentIds = rows.map(student => student.student_id)
    
    let interestsMap: Map<number, string> = new Map()
    
    if (studentIds.length > 0) {
      const [interestRows] = await pool.query<AcademicInterestRow[]>(
        `SELECT 
          student_id,
          GROUP_CONCAT(interest SEPARATOR ', ') as interests
        FROM academic_interests
        WHERE student_id IN (?)
        GROUP BY student_id`,
        [studentIds]
      )

      interestRows.forEach(row => {
        if (row.interests) {
          interestsMap.set(row.student_id, row.interests)
        }
      })
    }

    // Format the response - FLAT structure for easy access
    const students = rows.map(student => {
      const interests = interestsMap.get(student.student_id) || null
      
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
        academic_interests: interests,
        
        // Career Goals - FLAT
        primary_goal: student.primary_goal || null,
        secondary_goal: student.secondary_goal || null,
        timeline: student.timeline || null,
        location_preference: student.location_preference || null,
        intensity_level: student.intensity_level || null,
        
        // Stats
        total_skills: Number(student.total_skills) || 0,
        profile_completion: calculateProfileCompletion(student, interests),
        
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
        token: college.token,
        name: college.name
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