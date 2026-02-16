import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

// Helper to safely parse JSON stored in text columns
function safeJsonParse(value: any, fallback: any = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value; // already parsed
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  let connection;
  try {
    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_session')?.value;

    let studentId = searchParams.get('studentId');
    let token = searchParams.get('token');

    if ((!studentId || !token) && tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET!) as { id: number, role: string, collegeToken?: string };
        if (decoded.role === 'student') {
          studentId = String(decoded.id);
          if (decoded.collegeToken) {
            token = decoded.collegeToken;
          }
        }
      } catch (e) {
        console.error("JWT verification failed", e);
      }
    }

    // If we still don't have token but have studentId, we can fetch it from DB
    if (studentId && !token) {
      try {
        const [rows]: any = await pool.query('SELECT college_token FROM Students WHERE student_id = ?', [studentId]);
        if (rows && rows.length > 0) {
          token = rows[0].college_token;
        }
      } catch (e) { console.error(e) }
    }

    if (!studentId || !token) {
      return NextResponse.json(
        { error: 'Student ID and token are required' },
        { status: 400 }
      );
    }

    // Get database connection
    connection = await pool.getConnection();

    // Validate the token and get college information
    const [tokenResult] = await connection.execute<RowDataPacket[]>(
      `SELECT c.id as college_id, c.college_name, c.college_type, c.city, c.state, c.country
       FROM colleges c 
       JOIN college_tokens ct ON c.id = ct.college_id 
       WHERE ct.token = ? AND ct.is_active = TRUE`,
      [token]
    );

    if (!tokenResult || tokenResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const collegeInfo = tokenResult[0];

    // Single query to get ALL student data from Students table
    const [students] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        student_id, first_name, last_name, email, phone,
        program, current_year, current_semester, enrollment_year, current_gpa,
        academic_interests, career_quiz_answers,
        technical_skills, soft_skills, language_skills,
        primary_goal, secondary_goal, timeline, location_preference,
        industry_focus, intensity_level
       FROM Students
       WHERE student_id = ?`,
      [studentId]
    );

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = students[0];

    // Parse JSON fields from the Students table
    const academicInterests = safeJsonParse(student.academic_interests, []);
    const careerQuizAnswers = safeJsonParse(student.career_quiz_answers, {});
    const technicalSkills = safeJsonParse(student.technical_skills, {});
    const softSkills = safeJsonParse(student.soft_skills, {});
    const languageSkills = safeJsonParse(student.language_skills, {});
    const industryFocus = safeJsonParse(student.industry_focus, []);

    // Combine all data
    const processedData = {
      // Basic student info
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,

      // College info from token
      college_id: collegeInfo.college_id,
      college_name: collegeInfo.college_name,
      college_type: collegeInfo.college_type,
      city: collegeInfo.city,
      state: collegeInfo.state,
      country: collegeInfo.country,

      // Academic profile (from Students table)
      program: student.program || null,
      current_year: student.current_year || null,
      current_semester: student.current_semester || null,
      enrollment_year: student.enrollment_year || null,
      current_gpa: student.current_gpa || null,

      // Academic interests (parsed from JSON)
      academic_interests: Array.isArray(academicInterests) ? academicInterests : [],

      // Career quiz answers (parsed from JSON)
      career_quiz_answers: careerQuizAnswers,

      // Skills (parsed from JSON) - always return objects, even if empty
      technical_skills: technicalSkills || {},
      soft_skills: softSkills || {},
      language_skills: languageSkills || {},

      // Career goals (from Students table)
      primary_goal: student.primary_goal || null,
      secondary_goal: student.secondary_goal || null,
      timeline: student.timeline || null,
      location_preference: student.location_preference || null,
      intensity_level: student.intensity_level || null,

      // Industry focus (parsed from JSON)
      industry_focus: Array.isArray(industryFocus) ? industryFocus : []
    };

    // Return successful response
    return NextResponse.json({
      success: true,
      data: processedData
    });

  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Always release the connection
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
}