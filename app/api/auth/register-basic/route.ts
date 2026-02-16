import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

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
    } = await request.json();

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    // Create database connection
    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM Students WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
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
          created_at,
          updated_at,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE', NOW(), NOW(), TRUE)`,
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
        collegeId
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