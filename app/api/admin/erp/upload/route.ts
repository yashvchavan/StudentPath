import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { parseErpExcel } from '@/lib/erpParser';
import { getTpoSession } from '@/lib/tpo-auth';

export async function POST(request: NextRequest) {
  let connection;
  try {
    // Auth — only Central TPO (college role) can upload ERP data
    const session = await getTpoSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isCentralTPO) {
      return NextResponse.json({ error: 'Only Central TPO can upload ERP data' }, { status: 403 });
    }

    const collegeId = session.college_id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.' },
        { status: 400 }
      );
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
    }

    // Parse file
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedRows = parseErpExcel(buffer);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid student records found in the file. Please check the file format and column headers.' },
        { status: 400 }
      );
    }

    // Upsert into college_erp_students
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of parsedRows) {
      try {
        const [existing]: any = await connection.execute(
          'SELECT id FROM college_erp_students WHERE college_id = ? AND prn = ?',
          [collegeId, row.prn]
        );

        if (existing.length > 0) {
          // Update existing record
          await connection.execute(
            `UPDATE college_erp_students SET
              first_name = ?, last_name = ?, full_name = ?, email = ?,
              phone = ?, branch = ?, department = ?, year = ?,
              semester = ?, division = ?, roll_no = ?, gender = ?,
              date_of_birth = ?, address = ?, city = ?, state = ?,
              extra_data = ?, updated_at = NOW()
             WHERE college_id = ? AND prn = ?`,
            [
              row.first_name || null,
              row.last_name || null,
              row.full_name || null,
              row.email || null,
              row.phone || null,
              row.branch || null,
              row.department || null,
              row.year || null,
              row.semester || null,
              row.division || null,
              row.roll_no || null,
              row.gender || null,
              row.date_of_birth || null,
              row.address || null,
              row.city || null,
              row.state || null,
              row.extra_data ? JSON.stringify(row.extra_data) : null,
              collegeId,
              row.prn,
            ]
          );
          updated++;
        } else {
          // Insert new record
          await connection.execute(
            `INSERT INTO college_erp_students
              (college_id, prn, first_name, last_name, full_name, email, phone,
               branch, department, year, semester, division, roll_no, gender,
               date_of_birth, address, city, state, extra_data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              collegeId,
              row.prn,
              row.first_name || null,
              row.last_name || null,
              row.full_name || null,
              row.email || null,
              row.phone || null,
              row.branch || null,
              row.department || null,
              row.year || null,
              row.semester || null,
              row.division || null,
              row.roll_no || null,
              row.gender || null,
              row.date_of_birth || null,
              row.address || null,
              row.city || null,
              row.state || null,
              row.extra_data ? JSON.stringify(row.extra_data) : null,
            ]
          );
          inserted++;
        }
      } catch (rowError) {
        console.warn(`[ERP Upload] Skipping row PRN=${row.prn}:`, rowError);
        skipped++;
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `ERP data processed successfully`,
      totalParsed: parsedRows.length,
      inserted,
      updated,
      skipped,
    });
  } catch (error: any) {
    if (connection) {
      try { await connection.rollback(); } catch {}
    }
    console.error('[ERP Upload] Error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
