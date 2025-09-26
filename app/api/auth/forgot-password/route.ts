// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userType } = body; // 'student' | 'college' | 'professional'

    if (!email || !userType) {
      return NextResponse.json(
        { error: 'Email and user type are required' },
        { status: 400 }
      );
    }

    if (!['student', 'college', 'professional'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    let userExists = false;
    let userId: number | null = null;
    let userName = '';

    try {
      if (userType === 'student') {
        const [students] = await connection.execute(
          'SELECT student_id, first_name, last_name FROM Students WHERE email = ? AND is_active = TRUE',
          [email]
        );
        if (Array.isArray(students) && students.length > 0) {
          const student = (students as any[])[0];
          userExists = true;
          userId = student.student_id;
          userName = `${student.first_name} ${student.last_name}`;
        }
      } else if (userType === 'college') {
        const [colleges] = await connection.execute(
          'SELECT id, college_name FROM colleges WHERE email = ? AND is_active = TRUE',
          [email]
        );
        if (Array.isArray(colleges) && colleges.length > 0) {
          const college = (colleges as any[])[0];
          userExists = true;
          userId = college.id;
          userName = college.college_name;
        }
      } else if (userType === 'professional') {
        const [pros] = await connection.execute(
          'SELECT id, first_name, last_name FROM professionals WHERE email = ? AND is_active = TRUE',
          [email]
        );
        if (Array.isArray(pros) && pros.length > 0) {
          const pro = (pros as any[])[0];
          userExists = true;
          userId = pro.id;
          userName = `${pro.first_name} ${pro.last_name}`;
        }
      }

      // Security: don't reveal if email exists
      if (!userExists) {
        return NextResponse.json({
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token
      await connection.execute(
        `INSERT INTO password_reset_tokens (user_id, user_type, token_hash, expires_at, created_at) 
         VALUES (?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         token_hash = VALUES(token_hash), 
         expires_at = VALUES(expires_at), 
         created_at = NOW(), 
         used = FALSE`,
        [userId, userType, resetTokenHash, tokenExpiry]
      );

      // Send email
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&type=${userType}`;
      await sendPasswordResetEmail({
        to: email,
        name: userName,
        resetUrl,
        userType
      });

      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      });
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
