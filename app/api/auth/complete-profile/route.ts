import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  let connection;
  try {
    const payload = await request.json();

    const {
      student_id,
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
    } = payload;

    // Required fields check
    if (!student_id || !program || !currentYear) {
      return NextResponse.json(
        { error: 'Please provide all required fields: student_id, program, currentYear' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1️⃣ Check student exists
    const [students] = await connection.execute(
      'SELECT student_id FROM Students WHERE student_id = ?',
      [student_id]
    );
    if (!Array.isArray(students) || (students as any).length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 2️⃣ Upsert academic_profiles
    await connection.execute(
      `INSERT INTO academic_profiles (
        student_id, program, currentYear, currentSemester, enrollmentYear, currentGPA
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        program = VALUES(program),
        currentYear = VALUES(currentYear),
        currentSemester = VALUES(currentSemester),
        enrollmentYear = VALUES(enrollmentYear),
        currentGPA = VALUES(currentGPA)`,
      [student_id, program, currentYear, currentSemester, enrollmentYear, currentGPA]
    );

    // 3️⃣ Academic Interests (bulk)
    if (Array.isArray(academicInterests) && academicInterests.length > 0) {
      await connection.execute('DELETE FROM academic_interests WHERE student_id = ?', [student_id]);
      const interestRows = academicInterests.map((interest: string) => [student_id, interest]);
      await connection.query('INSERT INTO academic_interests (student_id, interest) VALUES ?', [interestRows]);
    }

    // 4️⃣ Career Quiz Answers (bulk)
    if (careerQuizAnswers && Object.keys(careerQuizAnswers).length > 0) {
      await connection.execute('DELETE FROM career_quiz_answers WHERE student_id = ?', [student_id]);
      const quizRows = Object.entries(careerQuizAnswers).map(([questionId, answer]) => [
        student_id,
        questionId,
        answer,
      ]);
      await connection.query(
        'INSERT INTO career_quiz_answers (student_id, questionId, answer) VALUES ?',
        [quizRows]
      );
    }

    // 5️⃣ Skills (technical, soft, language)
    const skillTypes: Record<string, any> = {
      technical: technicalSkills,
      soft: softSkills,
      language: languageSkills,
    };

    for (const [type, skills] of Object.entries(skillTypes)) {
      if (skills && Object.keys(skills).length > 0) {
        await connection.execute('DELETE FROM skills WHERE student_id = ? AND skillType = ?', [
          student_id,
          type,
        ]);
        const skillRows = Object.entries(skills).map(([name, level]) => [student_id, type, name, level]);
        await connection.query(
          'INSERT INTO skills (student_id, skillType, skillName, proficiencyLevel) VALUES ?',
          [skillRows]
        );
      }
    }

    // 6️⃣ Career Goals (single row upsert)
    await connection.execute(
      `INSERT INTO career_goals (
        student_id, primaryGoal, secondaryGoal, timeline, locationPreference, intensityLevel, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        primaryGoal = VALUES(primaryGoal),
        secondaryGoal = VALUES(secondaryGoal),
        timeline = VALUES(timeline),
        locationPreference = VALUES(locationPreference),
        intensityLevel = VALUES(intensityLevel),
        updatedAt = NOW()`,
      [student_id, primaryGoal, secondaryGoal, timeline, locationPreference, intensityLevel]
    );

    // 7️⃣ Industry Focus (bulk)
    if (Array.isArray(industryFocus) && industryFocus.length > 0) {
      await connection.execute('DELETE FROM industry_focus WHERE student_id = ?', [student_id]);
      const industryRows = industryFocus.map((industry: string) => [student_id, industry]);
      await connection.query('INSERT INTO industry_focus (student_id, industry) VALUES ?', [industryRows]);
    }

    // Commit transaction
    await connection.commit();

    return NextResponse.json({ message: 'Profile completed successfully', success: true });
  } catch (dbError: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        /* ignore rollback errors */
      }
    }
    console.error('DB Error:', dbError?.message, dbError?.sql);

    return NextResponse.json(
      { error: dbError?.message || 'Something went wrong while completing the profile' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
