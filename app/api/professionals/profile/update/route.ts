import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Allow sending professionalId or read from cookie
    let professionalId = body.professionalId || body.id;
    if (!professionalId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.split('; ').find((c) => c.startsWith('studentData='));
      if (match) {
        try {
          const session = JSON.parse(decodeURIComponent(match.split('=')[1]));
          professionalId = session.id;
        } catch {
          // ignore cookie parse errors
        }
      }
    }

    if (!professionalId) {
      return NextResponse.json({ success: false, error: 'professionalId required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    // Utility to safely add string fields (trims and converts non-string values)
    const safePush = (column: string, value: any) => {
      if (value !== undefined && value !== null) {
        let strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // Optional: limit max size to avoid 1406 if schema is still smaller
        if (strValue.length > 65000) {
          strValue = strValue.slice(0, 65000);
        }
        updates.push(`${column} = ?`);
        params.push(strValue.trim());
      }
    };

    safePush('first_name', body.firstName);
    safePush('last_name', body.lastName);
    safePush('phone', body.phone);
    safePush('company', body.company);
    safePush('designation', body.designation);
    safePush('linkedin', body.linkedin);
    safePush('github', body.github);
    safePush('portfolio', body.portfolio); // now safely handles any type
    safePush('certifications', body.certifications);
    safePush('career_goals', body.career_goals);
    safePush('preferred_learning_style', body.preferred_learning_style);

    // Handle skills (always JSON)
    if (body.skills !== undefined) {
      updates.push('skills = ?');
      params.push(JSON.stringify(Array.isArray(body.skills) ? body.skills : []));
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      const sql = `UPDATE professionals SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
      params.push(professionalId);

      // Debug log (can remove later)
      console.log('🧩 SQL:', sql);
      console.log('🧩 Params:', params.map(p => (p?.length ? `${typeof p}(${p.length})` : p)));

      const [result] = await connection.execute(sql, params);
      connection.release();

      return NextResponse.json({ success: true, message: 'Profile updated' });
    } catch (err: any) {
      connection.release();
      console.error('Profile update error', err);
      return NextResponse.json({ success: false, error: err.sqlMessage || 'Update failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Profile update route error', error);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
