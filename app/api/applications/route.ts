/**
 * /api/applications — CRUD for job applications (students + professionals)
 *
 * GET    — list all applications for the authenticated user
 * POST   — create a new application
 * PATCH  — update status / notes / next action
 * DELETE — delete an application (via ?id=)
 */

import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function getSession(req: NextRequest) {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return { id: payload.id as number, role: payload.role as string };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';

  try {
    const conn = await pool.getConnection();
    try {
      const conditions = ['user_id = ?', 'user_type = ?'];
      const params: any[] = [session.id, session.role];
      if (status) { conditions.push('status = ?'); params.push(status); }

      const [rows]: any = await conn.execute(
        `SELECT * FROM job_applications
         WHERE ${conditions.join(' AND ')}
         ORDER BY updated_at DESC`,
        params
      );

      const parseJSON = (val: any) => {
        if (!val) return [];
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return []; }
        }
        return val;
      };

      const apps = rows.map((r: any) => ({
        ...r,
        interview_rounds: parseJSON(r.interview_rounds),
        status_history: parseJSON(r.status_history),
      }));

      // Aggregate stats
      const stats = {
        total: apps.length,
        saved: apps.filter((a: any) => a.status === 'saved').length,
        applied: apps.filter((a: any) => a.status === 'applied').length,
        screening: apps.filter((a: any) => a.status === 'screening').length,
        interview: apps.filter((a: any) => a.status === 'interview').length,
        offer: apps.filter((a: any) => a.status === 'offer').length,
        rejected: apps.filter((a: any) => a.status === 'rejected').length,
      };

      return NextResponse.json({ success: true, data: apps, stats });
    } finally { conn.release(); }
  } catch (error: any) {
    console.error('[Applications GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      job_id, job_title, company, apply_url, logo_url, location,
      salary_range, status = 'saved', applied_date, notes,
      contact_name, contact_email, next_action, next_action_date,
    } = body;

    if (!job_title || !company) {
      return NextResponse.json({ error: 'job_title and company required' }, { status: 400 });
    }

    const statusHistory = [{ status, changedAt: new Date().toISOString(), note: 'Created' }];

    const conn = await pool.getConnection();
    try {
      const [result]: any = await conn.execute(
        `INSERT INTO job_applications
          (user_id, user_type, job_id, job_title, company, apply_url, logo_url, location,
           salary_range, status, applied_date, notes, contact_name, contact_email,
           next_action, next_action_date, status_history, interview_rounds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id, session.role, job_id || null,
          job_title, company, apply_url || null, logo_url || null, location || null,
          salary_range || null, status, applied_date || null, notes || null,
          contact_name || null, contact_email || null, next_action || null,
          next_action_date || null,
          JSON.stringify(statusHistory), JSON.stringify([]),
        ]
      );
      return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
    } finally { conn.release(); }
  } catch (error: any) {
    console.error('[Applications POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, notes, next_action, next_action_date, interview_rounds, contact_name, contact_email } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const conn = await pool.getConnection();
    try {
      // Verify ownership
      const [existing]: any = await conn.execute(
        `SELECT * FROM job_applications WHERE id = ? AND user_id = ? AND user_type = ?`,
        [id, session.id, session.role]
      );
      if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const app = existing[0];
      let statusHistory = [];
      try { statusHistory = JSON.parse(app.status_history || '[]'); } catch { statusHistory = []; }

      if (status && status !== app.status) {
        statusHistory.push({ status, changedAt: new Date().toISOString() });
      }

      await conn.execute(
        `UPDATE job_applications SET
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          next_action = COALESCE(?, next_action),
          next_action_date = COALESCE(?, next_action_date),
          contact_name = COALESCE(?, contact_name),
          contact_email = COALESCE(?, contact_email),
          interview_rounds = COALESCE(?, interview_rounds),
          status_history = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND user_type = ?`,
        [
          status || null, notes || null, next_action || null, next_action_date || null,
          contact_name || null, contact_email || null,
          interview_rounds ? JSON.stringify(interview_rounds) : null,
          JSON.stringify(statusHistory),
          id, session.id, session.role,
        ]
      );
      return NextResponse.json({ success: true });
    } finally { conn.release(); }
  } catch (error: any) {
    console.error('[Applications PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const conn = await pool.getConnection();
    try {
      await conn.execute(
        `DELETE FROM job_applications WHERE id = ? AND user_id = ? AND user_type = ?`,
        [id, session.id, session.role]
      );
      return NextResponse.json({ success: true });
    } finally { conn.release(); }
  } catch (error: any) {
    console.error('[Applications DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
