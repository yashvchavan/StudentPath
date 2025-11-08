  import { NextResponse } from 'next/server';
  import bcrypt from 'bcryptjs';
  import pool from '@/lib/db';

  export async function POST(request: Request) {
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
      const connection = await pool.getConnection();

      try {
        // Check if user already exists
        const [existingUsers] = await connection.execute(
          'SELECT * FROM Students WHERE email = ?',
          [email]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          connection.release();
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 409 }
          );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

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
            role,
            status,
            created_at,
            updated_at,
            is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE', NOW(), NOW(), TRUE)`,
          [
            firstName,
            lastName,
            email,
            phone || null,
            hashedPassword,
            dateOfBirth ? new Date(dateOfBirth) : null,
            gender || null,
            country || null,
            collegeToken || null
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
          connection.release();
          return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
          );
        }

        connection.release();

        return NextResponse.json({
          message: "Student registered successfully",
          userId: user.student_id,
          user
        });
        
      } catch (dbError: any) {
        connection.release();
        console.error('Database error:', {
          message: dbError?.message || 'Unknown database error',
          code: dbError?.code,
          sqlState: dbError?.sqlState,
          sql: dbError?.sql,
          stack: dbError?.stack
        });
        return NextResponse.json(
          { error: `Database error: ${dbError?.message || 'Unknown database error'}` },
          { status: 500 }
        );
      }
      
    } catch (error: any) {
      console.error('Registration error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack
      });
      return NextResponse.json(
        { error: `Registration failed: ${error?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  }