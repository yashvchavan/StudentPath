import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { getTrialDays } from '@/lib/subscriptions';

export async function POST(request: Request) {
  let connection;
  try {
    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      password,
      country,
      collegeToken,
      githubUsername,
      leetcodeUsername,
      linkedinUrl,
      division,
      rollNo,
      address,
      city,
      state,
    } = await request.json();

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    // Optional field validation
    if (githubUsername && !/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/i.test(githubUsername)) {
      return NextResponse.json({ error: "Invalid GitHub username format" }, { status: 400 });
    }
    
    if (linkedinUrl && !/^https?:\/\/(www\.)?linkedin\.com\/.*$/i.test(linkedinUrl)) {
      return NextResponse.json({ error: "Invalid LinkedIn URL format" }, { status: 400 });
    }
    
    if (leetcodeUsername && !/^[a-zA-Z0-9_]{1,15}$/i.test(leetcodeUsername)) {
      return NextResponse.json({ error: "Invalid LeetCode username format" }, { status: 400 });
    }

    // Create database connection
    connection = await pool.getConnection();

    // Check if user already exists (active OR soft-deleted)
    const [existingUsers] = await connection.execute(
      'SELECT * FROM Students WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      const existingUser = (existingUsers as any[])[0];

      // If the account is active, block re-registration
      if (existingUser.is_active === 1 || existingUser.is_active === true) {
        return NextResponse.json(
          { error: "User with this email already exists. Please login instead." },
          { status: 409 }
        );
      }

      // Account was soft-deleted — reactivate it
      const hashedPassword = await bcrypt.hash(password, 10);

      // Re-resolve college_id
      let collegeId = null;
      if (collegeToken) {
        const [tokenRows] = await connection.execute(
          `SELECT c.id FROM colleges c
           JOIN college_tokens ct ON c.id = ct.college_id
           WHERE ct.token = ? AND ct.is_active = TRUE`,
          [collegeToken]
        );
        if (Array.isArray(tokenRows) && (tokenRows as any).length > 0) {
          collegeId = (tokenRows as any)[0].id;
        }
      }

      // Reactivate, resetting all profile data for a fresh start
      const updateFields = `
          first_name = ?,
          last_name = ?,
          phone = ?,
          password_hash = ?,
          date_of_birth = ?,
          gender = ?,
          country = ?,
          college_token = ?,
          college_id = ?,
          github_username = ?,
          leetcode_username = ?,
          linkedin_url = ?,
          city = ?,
          state = ?,
          address = ?,
          division = ?,
          roll_no = ?,
          is_active = TRUE,
          status = 'ACTIVE',
          program = NULL,
          current_year = NULL,
          current_semester = NULL,
          academic_interests = NULL,
          career_quiz_answers = NULL,
          technical_skills = NULL,
          soft_skills = NULL,
          language_skills = NULL,
          primary_goal = NULL,
          secondary_goal = NULL,
          updated_at = NOW()`;
      const updateValues = [
        firstName, lastName,
        phone || null,
        hashedPassword,
        dateOfBirth ? new Date(dateOfBirth) : null,
        gender || null,
        country || null,
        collegeToken || null,
        collegeId,
        githubUsername || null,
        leetcodeUsername || null,
        linkedinUrl || null,
        city || null,
        state || null,
        address || null,
        division || null,
        rollNo || null,
        email
      ];

      try {
        // Try with prn column first
        await connection.execute(
          `UPDATE Students SET prn = ?, ${updateFields} WHERE email = ?`,
          [studentId || null, ...updateValues]
        );
      } catch (_) {
        // Fallback without prn if column doesn't exist yet
        await connection.execute(
          `UPDATE Students SET ${updateFields} WHERE email = ?`,
          updateValues
        );
      }

      // Fetch the updated user
      const [updatedUsers] = await connection.execute<any[]>(
        `SELECT student_id, first_name, last_name, email, phone, date_of_birth, gender, country, college_token, role, status
         FROM Students WHERE email = ?`,
        [email]
      );
      const updatedUser = Array.isArray(updatedUsers) && updatedUsers.length > 0 ? updatedUsers[0] : null;
      if (!updatedUser) {
        return NextResponse.json({ error: 'Failed to reactivate account' }, { status: 500 });
      }

      // Upsert subscription — duration from platform_config
      const trialDaysReactivate = await getTrialDays(collegeId ?? undefined);
      const trialEnd = new Date(Date.now() + trialDaysReactivate * 24 * 60 * 60 * 1000);
      try {
        await connection.execute(
          `INSERT INTO subscriptions (student_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
           VALUES (?, 'pro', 'trialing', NOW(), ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE plan='pro', status='trialing', current_period_end=?, updated_at=NOW()`,
          [updatedUser.student_id, trialEnd, trialEnd]
        );
      } catch (subErr) {
        console.warn('Subscription upsert failed (non-fatal):', subErr);
      }

      // Mark the ERP record as registered (reactivation path)
      if (studentId && collegeId && updatedUser?.student_id) {
        try {
          await connection.execute(
            `UPDATE college_erp_students
             SET is_registered = TRUE, registered_student_id = ?
             WHERE college_id = ? AND prn = ?`,
            [updatedUser.student_id, collegeId, studentId]
          );
        } catch (_) { /* non-fatal */ }
      }

      return NextResponse.json({
        message: 'Account restored successfully',
        userId: updatedUser.student_id,
        user: updatedUser
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Resolve college_id from college token
    let collegeId = null;
    if (collegeToken) {
      const [tokenRows] = await connection.execute(
        `SELECT c.id FROM colleges c 
         JOIN college_tokens ct ON c.id = ct.college_id 
         WHERE ct.token = ? AND ct.is_active = TRUE`,
        [collegeToken]
      );
      if (Array.isArray(tokenRows) && (tokenRows as any).length > 0) {
        collegeId = (tokenRows as any)[0].id;
      }
    }

    // Create student
    const [result] = await connection.execute(
      `INSERT INTO Students (
          first_name,
          last_name,
          email,
          phone,
          password_hash,
          date_of_birth,
          gender,
          country,
          college_token,
          college_id,
          role,
          status,
          github_username,
          leetcode_username,
          linkedin_url,
          city,
          state,
          address,
          division,
          roll_no,
          created_at,
          updated_at,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), TRUE)`,
      [
        firstName,
        lastName,
        email,
        phone || null,
        hashedPassword,
        dateOfBirth ? new Date(dateOfBirth) : null,
        gender || null,
        country || null,
        collegeToken || null,
        collegeId,
        githubUsername || null,
        leetcodeUsername || null,
        linkedinUrl || null,
        city || null,
        state || null,
        address || null,
        division || null,
        rollNo || null,
      ]
    );

    // Get the inserted user (without password)
    const [users] = await connection.execute<any[]>(
      `SELECT 
          student_id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          gender,
          country,
          college_token,
          role,
          status
        FROM Students 
        WHERE student_id = LAST_INSERT_ID()`
    );

    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Save PRN (non-fatal: column might not exist on older deployments)
    if (studentId && user.student_id) {
      try {
        await connection.execute(
          'UPDATE Students SET prn = ? WHERE student_id = ?',
          [studentId, user.student_id]
        );
      } catch (_) { /* prn column may not exist yet — safe to ignore */ }

      // Mark the ERP record as registered and link the new student
      if (collegeId) {
        try {
          await connection.execute(
            `UPDATE college_erp_students
             SET is_registered = TRUE, registered_student_id = ?
             WHERE college_id = ? AND prn = ?`,
            [user.student_id, collegeId, studentId]
          );
        } catch (_) { /* non-fatal */ }
      }
    }

    // Create free trial subscription — duration from platform_config (set via Platform Admin)
    try {
      const trialDays = await getTrialDays(collegeId ?? undefined);
      const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      await connection.execute(
        `INSERT INTO subscriptions
           (student_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
         VALUES (?, 'pro', 'trialing', NOW(), ?, NOW(), NOW())`,
        [user.student_id, trialEnd]
      );
    } catch (subErr) {
      console.warn('Trial subscription creation failed (non-fatal):', subErr);
    }

    return NextResponse.json({
      message: "Student registered successfully",
      userId: user.student_id,
      user
    });

  } catch (error: any) {
    console.error('Registration error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack
    });
    return NextResponse.json(
      { error: `Registration failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}