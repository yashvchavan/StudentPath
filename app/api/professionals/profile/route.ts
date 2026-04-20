import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';
import { ensureProfessionalSchema } from '@/lib/schema';

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function getAuthId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload.id as number;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  let connection;
  try {
    // Read professional ID from JWT cookie (secure) — fallback to query param for legacy support
    let professionalId: string | null = null;
    const authId = await getAuthId(req);
    if (authId) {
      professionalId = String(authId);
    } else {
      const url = new URL(req.url);
      professionalId = url.searchParams.get('professionalId');
    }

    if (!professionalId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    connection = await pool.getConnection();
    await ensureProfessionalSchema(connection);

    const [rows] = await connection.execute(
      `SELECT 
        id, first_name, last_name, email, phone, company, designation, 
        industry, experience, current_salary, expected_salary, linkedin, 
        github, leetcode_url, portfolio, profile_picture_base64, profile_picture_mime,
        skills, projects, certifications, career_goals, preferred_learning_style, level,
        is_active, created_at, updated_at 
      FROM professionals 
      WHERE id = ? AND is_active = 1`,
      [professionalId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
    }

    const prof: any = (rows as any)[0];

    let activeProjects = 0;
    let connections = 0;
    let notifications = 0;

    try {
      const [projRows] = await connection.execute('SELECT COUNT(*) as total FROM projects WHERE professional_id = ?', [professionalId]);
      activeProjects = Array.isArray(projRows) && (projRows as any)[0] ? Number((projRows as any)[0].total || 0) : 0;
    } catch { /* table may not exist */ }

    try {
      const [connRows] = await connection.execute('SELECT COUNT(*) as total FROM professional_connections WHERE professional_id = ?', [professionalId]);
      connections = Array.isArray(connRows) && (connRows as any)[0] ? Number((connRows as any)[0].total || 0) : 0;
    } catch { /* ignore */ }

    try {
      const [notifRows] = await connection.execute('SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND user_type = "professional" AND is_read = 0', [professionalId]);
      notifications = Array.isArray(notifRows) && (notifRows as any)[0] ? Number((notifRows as any)[0].total || 0) : 0;
    } catch { /* ignore */ }

    let skills: string[] = [];
    try { skills = prof.skills ? (typeof prof.skills === 'string' ? JSON.parse(prof.skills) : prof.skills) : []; } catch { skills = []; }

    // Fallback to normalized table if the base column is empty
    if (!skills.length) {
      try {
        const [skillRows]: any = await connection.execute(
          'SELECT skill_name FROM professional_skills WHERE professional_id = ? ORDER BY proficiency DESC, confidence DESC',
          [professionalId]
        );
        skills = Array.isArray(skillRows) ? skillRows.map((r: any) => r.skill_name).filter(Boolean) : [];
      } catch { /* ignore */ }
    }
    let skillsCount = skills.length;

    try {
      const [skRows] = await connection.execute('SELECT COUNT(*) as total FROM professional_skills WHERE professional_id = ?', [professionalId]);
      if (Array.isArray(skRows) && (skRows as any)[0]) {
        const count = Number((skRows as any)[0].total || 0);
        if (count > 0) skillsCount = count;
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      data: {
        id: prof.id,
        first_name: prof.first_name,
        last_name: prof.last_name,
        email: prof.email,
        phone: prof.phone,
        company: prof.company,
        designation: prof.designation,
        industry: prof.industry,
        experience: prof.experience,
        current_salary: prof.current_salary,
        expected_salary: prof.expected_salary,
        linkedin: prof.linkedin,
        github: prof.github,
        leetcode: prof.leetcode_url || '',
        portfolio: prof.portfolio,
        profile_picture_base64: prof.profile_picture_base64 || '',
        profile_picture_mime: prof.profile_picture_mime || '',
        skills,
        projects: prof.projects ? (typeof prof.projects === 'string' ? JSON.parse(prof.projects) : prof.projects) : [],
        certifications: prof.certifications,
        career_goals: prof.career_goals,
        preferred_learning_style: prof.preferred_learning_style,
        level: prof.level || '',
        is_active: !!prof.is_active,
        created_at: prof.created_at,
        updated_at: prof.updated_at,
        stats: { activeProjects, connections, notifications, skillsCount },
      },
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}