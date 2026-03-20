// app/api/student/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'
import jwt from 'jsonwebtoken'
import { getTpoSession } from '@/lib/tpo-auth'

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
  // TPO fields
  department_id?: number
  department_name?: string
  placement_status?: string
  backlogs?: number
}

interface AcademicInterestRow extends RowDataPacket {
  student_id: number
  interests: string
}

// ... (GET handler)
export async function GET(req: NextRequest) {
  try {
    // Try TPO session first (supports both college and dept_tpo)
    const tpoSession = await getTpoSession();

    let collegeToken: string | undefined;
    let collegeName: string | undefined;
    let collegeId: number | undefined;
    let departmentScope: number | null = null;

    if (tpoSession) {
      // TPO user (either central or departmental)
      collegeId = tpoSession.college_id;

      // Get college info
      const [collegeRows]: any = await pool.query(
        'SELECT college_token, college_name FROM colleges WHERE id = ?',
        [collegeId]
      );
      if (collegeRows.length > 0) {
        collegeToken = collegeRows[0].college_token;
        collegeName = collegeRows[0].college_name;
      }

      // Apply department scope for dept_tpo
      if (tpoSession.isDeptTPO && tpoSession.department_id) {
        departmentScope = tpoSession.department_id;
      }
    } else {
      // Fallback to legacy auth check
      const cookieStore = req.cookies;
      const token = cookieStore.get('auth_session')?.value;

      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized - College authentication required'
        }, { status: 401 });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
        if (decoded.role === 'college') {
          const [rows]: any = await pool.query('SELECT id, college_token, college_name FROM colleges WHERE id = ?', [decoded.id]);
          if (rows.length > 0) {
            collegeId = rows[0].id;
            collegeToken = rows[0].college_token;
            collegeName = rows[0].college_name;
          }
        }
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    if (!collegeToken || !collegeId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid college session'
      }, { status: 401 });
    }

    // Parse query parameters for advanced filters
    const { searchParams } = new URL(req.url);
    const filterDepartmentId = searchParams.get('departmentId');
    const filterSkills = searchParams.get('skills');
    const filterMinGpa = searchParams.get('minGpa');
    const filterMaxGpa = searchParams.get('maxGpa');
    const filterMaxBacklogs = searchParams.get('maxBacklogs');
    const filterPlacementStatus = searchParams.get('placementStatus');
    const filterYear = searchParams.get('year');
    const searchQuery = searchParams.get('search');

    console.log('Fetching students for college_token:', collegeToken);

    // Build dynamic WHERE clause
    let whereConditions = ['s.college_token = ?'];
    let queryParams: any[] = [collegeToken];

    // Department filter
    if (departmentScope) {
      // Dept TPO - forced scope
      whereConditions.push('s.department_id = ?');
      queryParams.push(departmentScope);
    } else if (filterDepartmentId) {
      // Central TPO optional filter
      whereConditions.push('s.department_id = ?');
      queryParams.push(parseInt(filterDepartmentId));
    }

    // GPA filter
    if (filterMinGpa) {
      whereConditions.push('s.current_gpa >= ?');
      queryParams.push(parseFloat(filterMinGpa));
    }
    if (filterMaxGpa) {
      whereConditions.push('s.current_gpa <= ?');
      queryParams.push(parseFloat(filterMaxGpa));
    }

    // Backlogs filter
    if (filterMaxBacklogs) {
      whereConditions.push('(s.backlogs IS NULL OR s.backlogs <= ?)');
      queryParams.push(parseInt(filterMaxBacklogs));
    }

    // Placement status filter
    if (filterPlacementStatus) {
      whereConditions.push('s.placement_status = ?');
      queryParams.push(filterPlacementStatus);
    }

    // Year filter
    if (filterYear) {
      whereConditions.push('s.current_year = ?');
      queryParams.push(parseInt(filterYear));
    }

    // Search filter (name or email)
    if (searchQuery) {
      whereConditions.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ?)');
      const searchPattern = `%${searchQuery}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Main query to get students with department info
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
        s.technical_skills,
        s.department_id,
        s.placement_status,
        s.backlogs,
        d.name as department_name,
        (SELECT MAX(ra.ats_score) FROM resume_analyses ra WHERE ra.student_id = s.student_id) as best_ats_score
      FROM Students s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY s.created_at DESC`,
      queryParams
    );

    console.log(`Found ${rows.length} students`);

    // Skills filter (post-query since it's JSON)
    let filteredRows = rows;
    if (filterSkills) {
      const requiredSkills = filterSkills.toLowerCase().split(',').map(s => s.trim());
      filteredRows = rows.filter(student => {
        if (!student.technical_skills) return false;
        let skills: any = {};
        if (typeof student.technical_skills === 'string') {
          try { skills = JSON.parse(student.technical_skills); } catch { return false; }
        } else {
          skills = student.technical_skills;
        }
        const studentSkills = Object.keys(skills).map(s => s.toLowerCase());
        return requiredSkills.every(req => studentSkills.some(s => s.includes(req)));
      });
    }

    // Parse JSON fields and build response
    const safeJsonParse = (value: any, fallback: any = {}) => {
      if (!value) return fallback;
      if (typeof value === 'object') return value;
      try { return JSON.parse(value); } catch { return fallback; }
    };

    // Format the response
    const students = filteredRows.map(student => {
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

        // Academic Information
        program: student.program || null,
        department: student.program || null,
        department_id: (student as any).department_id || null,
        department_name: (student as any).department_name || null,
        current_year: student.current_year || null,
        current_semester: student.current_semester || null,
        enrollment_year: student.enrollment_year || null,
        current_gpa: student.current_gpa ? Number(student.current_gpa) : null,
        academic_interests: interestsStr,
        backlogs: (student as any).backlogs || 0,

        // Placement Info
        placement_status: (student as any).placement_status || 'unplaced',
        best_ats_score: (student as any).best_ats_score || null,

        // Career Goals
        primary_goal: student.primary_goal || null,
        secondary_goal: student.secondary_goal || null,
        timeline: student.timeline || null,
        location_preference: student.location_preference || null,
        intensity_level: student.intensity_level || null,

        // Stats
        total_skills: totalSkills,
        skills_list: Object.keys(skills),
        profile_completion: calculateProfileCompletion(student, interestsStr),

        // Formatted display fields
        year_display: student.current_year ? `Year ${student.current_year}` : 'Not Set',
        gpa_display: student.current_gpa ? Number(student.current_gpa).toFixed(2) : 'N/A',
        program_display: student.program || 'Not Set',
        status_display: student.is_active === 1 ? 'Active' : 'Inactive',
        placement_status_display: formatPlacementStatus((student as any).placement_status)
      };
    });

    console.log(`Successfully formatted ${students.length} students`);

    // Get available departments for filter dropdown (Central TPO only)
    let availableDepartments: any[] = [];
    if (!departmentScope) {
      const [depts]: any = await pool.query(
        'SELECT id, name, code FROM departments WHERE college_id = ? AND is_active = TRUE ORDER BY name',
        [collegeId]
      );
      availableDepartments = depts;
    }

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
      collegeInfo: {
        token: collegeToken,
        name: collegeName
      },
      filters: {
        availableDepartments,
        isDeptScoped: !!departmentScope
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(student: StudentRow, interests?: string | null): number {
  let completedFields = 0;
  const totalFields = 10;

  if (student.first_name) completedFields++;
  if (student.email) completedFields++;
  if (student.program) completedFields++;
  if (student.current_year) completedFields++;
  if (student.current_gpa) completedFields++;
  if (interests && interests.length > 0) completedFields++;
  if (student.primary_goal) completedFields++;
  if (student.timeline) completedFields++;
  if (student.location_preference) completedFields++;
  if (student.intensity_level) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}

// Helper to format placement status
function formatPlacementStatus(status: string | null): string {
  switch (status) {
    case 'placed': return 'Placed';
    case 'opted_out': return 'Opted Out';
    case 'unplaced':
    default: return 'Unplaced';
  }
}

// Add OPTIONS for CORS if needed
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}