import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const professionalId = url.searchParams.get('professionalId');

    if (!professionalId) {
      return NextResponse.json({ error: 'professionalId is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    // Fetch professional row
    const [rows] = await connection.execute(
      'SELECT id, first_name, last_name, email, phone, company, designation, industry, experience, current_salary, expected_salary, linkedin, github, portfolio, skills, certifications, career_goals, preferred_learning_style, is_active, created_at, updated_at FROM professionals WHERE id = ? AND is_active = 1',
      [professionalId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
    }

    const prof: any = (rows as any)[0];

    // Attempt to compute helpful stats if related tables exist. If they don't, default to 0.
    let activeProjects = 0;
    let connections = 0;
    let notifications = 0;

    try {
      const [projRows] = await connection.execute('SELECT COUNT(*) as total FROM projects WHERE professional_id = ?', [professionalId]);
      activeProjects = Array.isArray(projRows) && (projRows as any)[0] ? Number((projRows as any)[0].total || 0) : 0;
    } catch (e) {
      // table may not exist - ignore
    }

    try {
      const [connRows] = await connection.execute('SELECT COUNT(*) as total FROM professional_connections WHERE professional_id = ?', [professionalId]);
      connections = Array.isArray(connRows) && (connRows as any)[0] ? Number((connRows as any)[0].total || 0) : 0;
    } catch (e) {
      // ignore
    }

    try {
      const [notifRows] = await connection.execute('SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND user_type = "professional"', [professionalId]);
      notifications = Array.isArray(notifRows) && (notifRows as any)[0] ? Number((notifRows as any)[0].total || 0) : 0;
    } catch (e) {
      // ignore
    }

    connection.release();

    // Parse JSON fields safely
    let skills = [] as string[];
    try {
      skills = prof.skills ? JSON.parse(prof.skills) : [];
    } catch (e) {
      skills = [];
    }

    const result = {
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
        portfolio: prof.portfolio,
        skills,
        certifications: prof.certifications,
        career_goals: prof.career_goals,
        preferred_learning_style: prof.preferred_learning_style,
        is_active: !!prof.is_active,
        created_at: prof.created_at,
        updated_at: prof.updated_at,
        stats: {
          activeProjects,
          connections,
          notifications,
          skillsCount: skills.length,
        },
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
