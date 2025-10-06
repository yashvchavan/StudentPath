import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const {
      userId,
      program,
      currentYear,
      currentSemester,
      enrollmentYear,
      currentGPA,
      academicInterests,
      careerQuizAnswers,
      technicalSkills,
      softSkills,
      languageSkills,
      primaryGoal,
      secondaryGoal,
      timeline,
      locationPreference,
      industryFocus,
      intensityLevel,
    } = await request.json();

    // Basic validation
    if (!userId || !program || !currentYear) {
      return NextResponse.json(
        { error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    // Create database connection
    const connection = await pool.getConnection();

    try {
      // First, check if the student exists
      const [students] = await connection.execute(
        'SELECT student_id FROM Students WHERE student_id = ?',
        [userId]
      );

      if (!Array.isArray(students) || students.length === 0) {
        connection.release();
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      // Update academic profile
      await connection.execute(
        `INSERT INTO academic_profiles (
          userId,
          program,
          currentYear,
          currentSemester,
          enrollmentYear,
          currentGPA
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          program = VALUES(program),
          currentYear = VALUES(currentYear),
          currentSemester = VALUES(currentSemester),
          enrollmentYear = VALUES(enrollmentYear),
          currentGPA = VALUES(currentGPA)`,
        [
          userId,
          program,
          currentYear,
          currentSemester,
          enrollmentYear,
          currentGPA
        ]
      );

      // Store academic interests
      if (academicInterests && academicInterests.length > 0) {
        // First delete existing interests
        await connection.execute(
          'DELETE FROM academic_interests WHERE userId = ?',
          [userId]
        );

        // Insert new interests
        const interestValues = academicInterests.map((interest: string) => [userId, interest]);
        await connection.execute(
          'INSERT INTO academic_interests (userId, interest) VALUES ?',
          [interestValues]
        );
      }

      // Store career quiz answers
      if (careerQuizAnswers && Object.keys(careerQuizAnswers).length > 0) {
        await connection.execute(
          'DELETE FROM career_quiz_answers WHERE userId = ?',
          [userId]
        );

        const quizAnswers = Object.entries(careerQuizAnswers).map(
          ([questionId, answer]) => [userId, questionId, answer]
        );
        await connection.execute(
          'INSERT INTO career_quiz_answers (userId, questionId, answer) VALUES ?',
          [quizAnswers]
        );
      }

      // Store skills
      const skillTypes = {
        technical: technicalSkills,
        soft: softSkills,
        language: languageSkills
      };

      for (const [type, skills] of Object.entries(skillTypes)) {
        if (skills && Object.keys(skills).length > 0) {
          // Delete existing skills of this type
          await connection.execute(
            'DELETE FROM skills WHERE userId = ? AND skillType = ?',
            [userId, type]
          );

          // Insert new skills
          const skillValues = Object.entries(skills).map(
            ([name, level]) => [userId, type, name, level]
          );
          await connection.execute(
            'INSERT INTO skills (userId, skillType, skillName, proficiencyLevel) VALUES ?',
            [skillValues]
          );
        }
      }

      // Store career goals
      await connection.execute(
        `INSERT INTO career_goals (
          userId,
          primaryGoal,
          secondaryGoal,
          timeline,
          locationPreference,
          intensityLevel,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          primaryGoal = VALUES(primaryGoal),
          secondaryGoal = VALUES(secondaryGoal),
          timeline = VALUES(timeline),
          locationPreference = VALUES(locationPreference),
          intensityLevel = VALUES(intensityLevel),
          updatedAt = NOW()`,
        [
          userId,
          primaryGoal,
          secondaryGoal,
          timeline,
          locationPreference,
          intensityLevel
        ]
      );

      // Store industry focus
      if (industryFocus && industryFocus.length > 0) {
        await connection.execute(
          'DELETE FROM industry_focus WHERE userId = ?',
          [userId]
        );

        const industryValues = industryFocus.map((industry: string) => [userId, industry]);
        await connection.execute(
          'INSERT INTO industry_focus (userId, industry) VALUES ?',
          [industryValues]
        );
      }

      connection.release();

      return NextResponse.json({
        message: "Profile completed successfully",
        success: true
      });
      
    } catch (dbError) {
      connection.release();
      throw dbError;
    }
    
  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { error: "Something went wrong while completing the profile" },
      { status: 500 }
    );
  }
}