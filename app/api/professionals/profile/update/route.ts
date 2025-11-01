import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Allow sending professionalId or read from body.session (client cookie shape)
    let professionalId = body.professionalId || body.id;

    // If not provided, try cookie from request headers
    if (!professionalId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.split('; ').find((c) => c.startsWith('studentData='));
      if (match) {
        try {
          const session = JSON.parse(decodeURIComponent(match.split('=')[1]));
          professionalId = session.id;
        } catch (e) {
          // ignore
        }
      }
    }

    if (!professionalId) {
      return NextResponse.json({ success: false, error: 'professionalId required' }, { status: 400 });
    }

    const allowedFields = [
      'firstName', 'lastName', 'phone', 'company', 'designation', 'linkedin', 'github', 'portfolio',
      'skills', 'certifications', 'career_goals', 'preferred_learning_style'
    ];

    const updates: string[] = [];
    const params: any[] = [];

    if (body.firstName !== undefined) {
      updates.push('first_name = ?'); params.push(body.firstName);
    }
    if (body.lastName !== undefined) {
      updates.push('last_name = ?'); params.push(body.lastName);
    }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.company !== undefined) { updates.push('company = ?'); params.push(body.company); }
    if (body.designation !== undefined) { updates.push('designation = ?'); params.push(body.designation); }
    if (body.linkedin !== undefined) { updates.push('linkedin = ?'); params.push(body.linkedin); }
    if (body.github !== undefined) { updates.push('github = ?'); params.push(body.github); }
    if (body.portfolio !== undefined) { updates.push('portfolio = ?'); params.push(body.portfolio); }
    if (body.certifications !== undefined) { updates.push('certifications = ?'); params.push(body.certifications); }
    if (body.career_goals !== undefined) { updates.push('career_goals = ?'); params.push(body.career_goals); }
    if (body.preferred_learning_style !== undefined) { updates.push('preferred_learning_style = ?'); params.push(body.preferred_learning_style); }
    if (body.skills !== undefined) {
      // ensure skills stored as JSON string
      params.push(JSON.stringify(Array.isArray(body.skills) ? body.skills : []));
      updates.push('skills = ?');
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      const sql = `UPDATE professionals SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
      params.push(professionalId);
      const [result] = await connection.execute(sql, params);
      connection.release();
      return NextResponse.json({ success: true, message: 'Profile updated' });
    } catch (err) {
      connection.release();
      console.error('Profile update error', err);
      return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Profile update route error', error);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
