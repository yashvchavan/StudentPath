import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Public endpoint — checks by college token (no auth required)
// Used by the student registration page to decide PRN vs manual flow
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Resolve college ID from token
    const [tokenRows]: any = await connection.execute(
      `SELECT c.id, c.college_name
       FROM colleges c
       JOIN college_tokens ct ON c.id = ct.college_id
       WHERE ct.token = ? AND ct.is_active = TRUE AND c.is_active = TRUE`,
      [token]
    );

    if (!tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const { id: collegeId, college_name: collegeName } = tokenRows[0];

    // Count ERP records for this college
    const [countRows]: any = await connection.execute(
      'SELECT COUNT(*) as total FROM college_erp_students WHERE college_id = ?',
      [collegeId]
    );

    const total = countRows[0]?.total || 0;

    return NextResponse.json({
      hasErpData: total > 0,
      totalRecords: total,
      collegeName,
      collegeId,
    });
  } catch (error: any) {
    console.error('[ERP Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
