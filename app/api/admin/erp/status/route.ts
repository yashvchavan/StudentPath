import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Force dynamic so Next.js never caches this route
export const dynamic = 'force-dynamic';

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
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN is_registered = 1 THEN 1 ELSE 0 END) as registered,
         SUM(CASE WHEN is_registered = 1 THEN 0 ELSE 1 END) as unregistered
       FROM college_erp_students WHERE college_id = ?`,
      [collegeId]
    );

    const total = Number(countRows[0]?.total) || 0;
    const registeredCount = Number(countRows[0]?.registered) || 0;
    const unregisteredCount = Number(countRows[0]?.unregistered) || 0;

    return NextResponse.json(
      {
        hasErpData: total > 0,
        totalRecords: total,
        registeredCount,
        unregisteredCount,
        collegeName,
        collegeId,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[ERP Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
