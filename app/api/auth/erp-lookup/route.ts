import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendErpOtpEmail } from '@/lib/email';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '****@****.***';
  const masked = local.slice(0, 2) + '*'.repeat(Math.max(1, local.length - 2));
  return `${masked}@${domain}`;
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { prn, collegeToken } = await request.json();

    if (!prn || !collegeToken) {
      return NextResponse.json({ error: 'PRN and college token are required' }, { status: 400 });
    }

    const trimmedPrn = String(prn).trim();

    connection = await pool.getConnection();

    // Resolve college from token
    const [tokenRows]: any = await connection.execute(
      `SELECT c.id, c.college_name
       FROM colleges c
       JOIN college_tokens ct ON c.id = ct.college_id
       WHERE ct.token = ? AND ct.is_active = TRUE AND c.is_active = TRUE`,
      [collegeToken]
    );

    if (!tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: 'Invalid college token' }, { status: 404 });
    }

    const { id: collegeId, college_name: collegeName } = tokenRows[0];

    // Lookup student in ERP data (case-insensitive PRN match)
    const [studentRows]: any = await connection.execute(
      `SELECT id, prn, first_name, last_name, full_name, email
       FROM college_erp_students
       WHERE college_id = ? AND LOWER(TRIM(prn)) = LOWER(?)`,
      [collegeId, trimmedPrn]
    );

    if (!studentRows || studentRows.length === 0) {
      return NextResponse.json(
        { error: 'PRN not found in college records. Please contact your college administrator.' },
        { status: 404 }
      );
    }

    const student = studentRows[0];

    if (!student.email) {
      return NextResponse.json(
        { error: 'No email address associated with this PRN. Please use manual registration or contact your administrator.' },
        { status: 400 }
      );
    }

    // Check if student already completed registration
    if (student.is_registered) {
      return NextResponse.json(
        { error: 'This PRN is already registered. Please login instead.' },
        { status: 409 }
      );
    }

    // Invalidate previous unused OTPs for this PRN
    await connection.execute(
      `UPDATE erp_otps SET is_used = TRUE
       WHERE college_id = ? AND prn = ? AND is_used = FALSE`,
      [collegeId, trimmedPrn]
    );

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await connection.execute(
      `INSERT INTO erp_otps (college_id, prn, email, otp_hash, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [collegeId, trimmedPrn, student.email, otpHash, expiresAt]
    );

    // Send OTP email
    const studentName = student.full_name ||
      `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
      'Student';

    await sendErpOtpEmail({
      to: student.email,
      studentName,
      otp,
      collegeName,
      expiresInMinutes: 10,
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      emailHint: maskEmail(student.email),
      prn: trimmedPrn,
    });
  } catch (error: any) {
    console.error('[ERP Lookup] Error:', error);
    return NextResponse.json(
      { error: `Failed to send OTP: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
