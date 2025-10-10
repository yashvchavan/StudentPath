import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  let connection;
  try {
    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const token = searchParams.get('token');

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

    // 1. Get basic student data
    const [students] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        student_id,
        first_name,
        last_name,
        email,
        phone
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

    // 2. Get academic profile
    const [academicProfiles] = await connection.execute<RowDataPacket[]>(
      `SELECT program, currentYear, currentSemester, enrollmentYear, currentGPA
       FROM academic_profiles
       WHERE student_id = ?`,
      [studentId]
    );

    const academicProfile = (academicProfiles && academicProfiles[0]) || {};

    // 3. Get academic interests
    const [academicInterests] = await connection.execute<RowDataPacket[]>(
      `SELECT interest FROM academic_interests WHERE student_id = ?`,
      [studentId]
    );

    // 4. Get career quiz answers
    const [careerQuizAnswers] = await connection.execute<RowDataPacket[]>(
      `SELECT questionId, answer FROM career_quiz_answers WHERE student_id = ?`,
      [studentId]
    );

    const quizAnswersObj = (careerQuizAnswers || []).reduce((acc: any, row: any) => {
      acc[row.questionId] = row.answer;
      return acc;
    }, {});

    // 5. Get skills (technical, soft, language)
    const [skills] = await connection.execute<RowDataPacket[]>(
      `SELECT skillType, skillName, proficiencyLevel 
       FROM skills 
       WHERE student_id = ?`,
      [studentId]
    );

    const technicalSkills: any = {};
    const softSkills: any = {};
    const languageSkills: any = {};

    if (skills && Array.isArray(skills)) {
      skills.forEach((skill: any) => {
        if (skill.skillType === 'technical') {
          technicalSkills[skill.skillName] = skill.proficiencyLevel;
        } else if (skill.skillType === 'soft') {
          softSkills[skill.skillName] = skill.proficiencyLevel;
        } else if (skill.skillType === 'language') {
          languageSkills[skill.skillName] = skill.proficiencyLevel;
        }
      });
    }

    // 6. Get career goals
    const [careerGoals] = await connection.execute<RowDataPacket[]>(
      `SELECT primaryGoal, secondaryGoal, timeline, locationPreference, intensityLevel
       FROM career_goals
       WHERE student_id = ?`,
      [studentId]
    );

    const careerGoal = (careerGoals && careerGoals[0]) || {};

    // 7. Get industry focus
    const [industryFocus] = await connection.execute<RowDataPacket[]>(
      `SELECT industry FROM industry_focus WHERE student_id = ?`,
      [studentId]
    );

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
      
      // Academic profile
      program: academicProfile.program || null,
      current_year: academicProfile.currentYear || null,
      current_semester: academicProfile.currentSemester || null,
      enrollment_year: academicProfile.enrollmentYear || null,
      current_gpa: academicProfile.currentGPA || null,
      
      // Academic interests (array of strings)
      academic_interests: (academicInterests || []).map((item: any) => item.interest),
      
      // Career quiz answers (object)
      career_quiz_answers: quizAnswersObj,
      
      // Skills (objects) - always return objects, even if empty
      technical_skills: technicalSkills || {},
      soft_skills: softSkills || {},
      language_skills: languageSkills || {},
      
      // Career goals
      primary_goal: careerGoal.primaryGoal || null,
      secondary_goal: careerGoal.secondaryGoal || null,
      timeline: careerGoal.timeline || null,
      location_preference: careerGoal.locationPreference || null,
      intensity_level: careerGoal.intensityLevel || null,
      
      // Industry focus (array of strings)
      industry_focus: (industryFocus || []).map((item: any) => item.industry)
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