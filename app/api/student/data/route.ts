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
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_session')?.value;

    let studentId = searchParams.get('studentId');

    // Decode JWT to get studentId if not in query param
    if (!studentId && tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET!) as { id: number, role: string };
        if (decoded.role === 'student') {
          studentId = String(decoded.id);
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Verify the requesting user is the same student (security check)
    if (tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET!) as { id: number, role: string };
        if (decoded.role !== 'student' || String(decoded.id) !== String(studentId)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }

    connection = await pool.getConnection();

    // Fetch all student data + college info in one query via JOIN
    const [students] = await connection.execute<RowDataPacket[]>(
      `SELECT
        s.student_id, s.first_name, s.last_name, s.email, s.phone,
        s.program, s.current_year, s.current_semester, s.enrollment_year, s.current_gpa,
        s.academic_interests, s.career_quiz_answers,
        s.technical_skills, s.soft_skills, s.language_skills,
        s.merged_skills, s.last_skill_analysis,
        s.primary_goal, s.secondary_goal, s.timeline, s.location_preference,
        s.industry_focus, s.intensity_level,
        s.prn, s.date_of_birth, s.gender, s.country,
        s.github_username, s.leetcode_username, s.linkedin_url,
        s.college_token, s.college_id,
        c.college_name, c.college_type, c.city, c.state, c.country AS college_country
       FROM Students s
       LEFT JOIN colleges c ON s.college_id = c.id
       WHERE s.student_id = ? AND s.is_active = TRUE`,
      [studentId]
    );

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = students[0];

    // Parse JSON fields
    const academicInterests = safeJsonParse(student.academic_interests, []);
    const careerQuizAnswers = safeJsonParse(student.career_quiz_answers, {});
    const technicalSkills   = safeJsonParse(student.technical_skills, {});
    const softSkills        = safeJsonParse(student.soft_skills, {});
    const languageSkills    = safeJsonParse(student.language_skills, {});
    const industryFocus     = safeJsonParse(student.industry_focus, []);
    const mergedSkills      = safeJsonParse(student.merged_skills, []);

    const processedData = {
      // Identity
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
      prn: student.prn,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      country: student.country,
      github_username: student.github_username,
      leetcode_username: student.leetcode_username,
      linkedin_url: student.linkedin_url,

      // College info (from JOIN)
      college_id: student.college_id,
      college_name: student.college_name || 'Your College',
      college_type: student.college_type || '',
      city: student.city || '',
      state: student.state || '',

      // Academic profile (from Students table)
      program: student.program || null,
      current_year: student.current_year || null,
      current_semester: student.current_semester || null,
      enrollment_year: student.enrollment_year || null,
      current_gpa: student.current_gpa || null,

      // Academic interests
      academic_interests: Array.isArray(academicInterests) ? academicInterests : [],

      // Career quiz
      career_quiz_answers: careerQuizAnswers,

      // Skills
      technical_skills: typeof technicalSkills === 'object' && !Array.isArray(technicalSkills)
        ? technicalSkills : {},
      soft_skills: typeof softSkills === 'object' && !Array.isArray(softSkills)
        ? softSkills : {},
      language_skills: typeof languageSkills === 'object' && !Array.isArray(languageSkills)
        ? languageSkills : {},

      // AI skill passport
      merged_skills: Array.isArray(mergedSkills) ? mergedSkills : [],
      last_skill_analysis: student.last_skill_analysis
        ? new Date(student.last_skill_analysis).toISOString()
        : null,

      // Career goals
      primary_goal: student.primary_goal || null,
      secondary_goal: student.secondary_goal || null,
      timeline: student.timeline || null,
      location_preference: student.location_preference || null,
      intensity_level: student.intensity_level || null,

      // Industry focus
      industry_focus: Array.isArray(industryFocus) ? industryFocus : []
    };

    return NextResponse.json({ success: true, data: processedData });

  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try { connection.release(); } catch (_) {}
    }
  }
}