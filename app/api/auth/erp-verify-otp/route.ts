import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { prn, otp, collegeToken } = await request.json();

    if (!prn || !otp || !collegeToken) {
      return NextResponse.json({ error: 'PRN, OTP, and college token are required' }, { status: 400 });
    }

    const trimmedPrn = String(prn).trim();
    const trimmedOtp = String(otp).trim();

    connection = await pool.getConnection();

    // Resolve college from token
    const [tokenRows]: any = await connection.execute(
      `SELECT c.id FROM colleges c
       JOIN college_tokens ct ON c.id = ct.college_id
       WHERE ct.token = ? AND ct.is_active = TRUE AND c.is_active = TRUE`,
      [collegeToken]
    );

    if (!tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: 'Invalid college token' }, { status: 404 });
    }

    const collegeId = tokenRows[0].id;

    // Get the most recent valid OTP
    const [otpRows]: any = await connection.execute(
      `SELECT id, otp_hash, expires_at
       FROM erp_otps
       WHERE college_id = ? AND prn = ? AND is_used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [collegeId, trimmedPrn]
    );

    if (!otpRows || otpRows.length === 0) {
      return NextResponse.json({ error: 'No active OTP found. Please request a new one.' }, { status: 404 });
    }

    const otpRecord = otpRows[0];

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(trimmedOtp, otpRecord.otp_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP. Please check and try again.' }, { status: 400 });
    }

    // Mark OTP as used
    await connection.execute(
      'UPDATE erp_otps SET is_used = TRUE WHERE id = ?',
      [otpRecord.id]
    );

    // Fetch full student ERP data
    const [studentRows]: any = await connection.execute(
      `SELECT id, prn, first_name, last_name, full_name, email, phone,
              branch, department, year, semester, division, roll_no,
              gender, date_of_birth, address, city, state, extra_data
       FROM college_erp_students
       WHERE college_id = ? AND LOWER(TRIM(prn)) = LOWER(?)`,
      [collegeId, trimmedPrn]
    );

    if (!studentRows || studentRows.length === 0) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    const student = studentRows[0];

    // Build display name
    const firstName = student.first_name ||
      (student.full_name ? student.full_name.split(' ')[0] : '');
    const lastName = student.last_name ||
      (student.full_name && student.full_name.split(' ').length > 1
        ? student.full_name.split(' ').slice(1).join(' ')
        : '');

    return NextResponse.json({
      success: true,
      studentData: {
        prn: student.prn,
        firstName,
        lastName,
        fullName: student.full_name || `${firstName} ${lastName}`.trim(),
        email: student.email,
        phone: student.phone || '',
        branch: student.branch || '',
        department: student.department || student.branch || '',
        year: student.year ? String(student.year) : '',
        semester: student.semester ? String(student.semester) : '',
        division: student.division || '',
        rollNo: student.roll_no || '',
        gender: student.gender || '',
        dateOfBirth: student.date_of_birth
          ? new Date(student.date_of_birth).toISOString().split('T')[0]
          : '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
      },
    });
  } catch (error: any) {
    console.error('[ERP Verify OTP] Error:', error);
    return NextResponse.json(
      { error: `Verification failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
