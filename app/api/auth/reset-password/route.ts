// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

type UserType = 'student' | 'college' | 'professional';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword, userType } = body as {
      token: string;
      newPassword: string;
      userType: UserType;
    };

    if (!token || !newPassword || !userType) {
      return NextResponse.json(
        { error: 'Token, new password, and user type are required' },
        { status: 400 }
      );
    }

    if (!['student', 'college', 'professional'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Hash the token to match DB
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Get reset token
      const [tokenResult] = await connection.execute(
        `SELECT user_id, user_type, expires_at, used 
         FROM password_reset_tokens 
         WHERE token_hash = ? AND user_type = ? AND used = FALSE AND expires_at > NOW()`,
        [tokenHash, userType]
      );

      const tokens = tokenResult as Array<any>;
      if (!tokens || tokens.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      const resetData = tokens[0];
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password based on userType
      switch (userType) {
        case 'student':
          await connection.execute(
            'UPDATE Students SET password_hash = ?, updated_at = NOW() WHERE student_id = ?',
            [hashedPassword, resetData.user_id]
          );
          break;
        case 'college':
          await connection.execute(
            'UPDATE colleges SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, resetData.user_id]
          );
          break;
        case 'professional':
          await connection.execute(
            'UPDATE professionals SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, resetData.user_id]
          );
          break;
      }

      // Mark token as used
      await connection.execute(
        'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE token_hash = ?',
        [tokenHash]
      );

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully',
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
