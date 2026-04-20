/**
 * GET  /api/jobs         — List jobs with filters + pagination
 * POST /api/jobs/match   — Get match score for a specific job
 */

import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';
import { quickMatchScore } from '@/lib/jobs/jobMatcher';

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function getSession(req: NextRequest) {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return { id: payload.id as number, role: payload.role as string };
  } catch { return null; }
}

async function getUserSkills(userId: number, role: string): Promise<string[]> {
  try {
    const conn = await pool.getConnection();
    try {
      if (role === 'student') {
        const [rows]: any = await conn.execute(
          `SELECT merged_skills, technical_skills FROM Students WHERE student_id = ?`, [userId]
        );
        if (!rows?.length) return [];
        const row = rows[0];
        let skills: string[] = [];
        // Prefer merged_skills (from GitHub+LeetCode+Resume sync)
        if (row.merged_skills) {
          try {
            const parsed = JSON.parse(row.merged_skills);
            skills = Array.isArray(parsed)
              ? parsed.map((s: any) => typeof s === 'string' ? s : s.name || s.skill || '')
              : Object.keys(parsed);
          } catch { /* fall through */ }
        }
        if (!skills.length && row.technical_skills) {
          try {
            const parsed = JSON.parse(row.technical_skills);
            skills = Object.keys(parsed);
          } catch { /* ignore */ }
        }
        return skills.filter(Boolean);
      } else if (role === 'professional') {
        const [rows]: any = await conn.execute(
          `SELECT skills FROM professionals WHERE id = ?`, [userId]
        );
        if (!rows?.length) return [];
        try { return JSON.parse(rows[0].skills || '[]'); } catch { return []; }
      }
    } finally { conn.release(); }
  } catch { /* ignore */ }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const url = new URL(req.url);

    // ── Parse query params ──────────────────────────────────────────────
    const type = url.searchParams.get('type') || '';             // internship|fresher|experienced
    const level = url.searchParams.get('level') || '';           // junior|mid|senior|lead
    const location = url.searchParams.get('location') || '';     // text search
    const remote = url.searchParams.get('remote') || '';         // '1' for remote only
    const skills = url.searchParams.get('skills') || '';         // comma-separated
    const industry = url.searchParams.get('industry') || '';     // text filter
    const salaryMin = parseInt(url.searchParams.get('salaryMin') || '0', 10) || 0;
    const salaryMax = parseInt(url.searchParams.get('salaryMax') || '0', 10) || 0;
    const expMin = parseInt(url.searchParams.get('expMin') || '0', 10) || 0;
    const expMax = parseInt(url.searchParams.get('expMax') || '0', 10) || 0;
    const search = url.searchParams.get('q') || '';              // full-text search
    const sort = url.searchParams.get('sort') || 'latest';       // latest|match|salary
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // ── Build WHERE clauses ─────────────────────────────────────────────
    const conditions: string[] = ['j.is_active = TRUE'];
    const params: any[] = [];

    if (type) { conditions.push('j.type = ?'); params.push(type); }
    if (level) { conditions.push('j.job_level = ?'); params.push(level); }
    if (remote === '1') { conditions.push('j.is_remote = TRUE'); }
    if (location) { conditions.push('j.location LIKE ?'); params.push(`%${location}%`); }
    if (industry) { conditions.push('(j.industry LIKE ? OR j.category LIKE ?)'); params.push(`%${industry}%`, `%${industry}%`); }
    if (salaryMin > 0) { conditions.push('(j.salary_min IS NULL OR j.salary_min >= ?)'); params.push(salaryMin); }
    if (salaryMax > 0) { conditions.push('(j.salary_max IS NULL OR j.salary_max <= ?)'); params.push(salaryMax); }
    if (expMin > 0) { conditions.push('j.min_experience >= ?'); params.push(expMin); }
    if (expMax > 0) { conditions.push('(j.max_experience IS NULL OR j.max_experience <= ?)'); params.push(expMax); }
    if (search) {
      conditions.push('(j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      for (const skill of skillList) {
        conditions.push('j.skills_required LIKE ?');
        params.push(`%${skill}%`);
      }
    }

    // ── Sort ─────────────────────────────────────────────────────────────
    const orderBy = sort === 'salary'
      ? 'j.salary_max DESC, j.salary_min DESC, j.posted_at DESC'
      : 'j.posted_at DESC, j.id DESC';

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── Count + fetch ─────────────────────────────────────────────────────
    const conn = await pool.getConnection();
    try {
      const [countRows]: any = await conn.execute(
        `SELECT COUNT(*) as total FROM jobs j ${whereClause}`,
        params
      );
      const total = Number(countRows[0]?.total) || 0;

      // NOTE: LIMIT and OFFSET are inlined (not ?-placeholders) because mysql2
      // prepared statements throw ER_WRONG_ARGUMENTS when JS integers from
      // parseInt() are bound to LIMIT/OFFSET parameters. Both values are
      // already validated safe integers above.
      const [rows]: any = await conn.execute(
        `SELECT j.id, j.external_id, j.source, j.type, j.job_level,
                j.title, j.company, j.logo_url, j.location, j.is_remote,
                j.salary, j.salary_min, j.salary_max, j.currency, j.stipend,
                j.min_experience, j.max_experience,
                j.skills_required, j.category, j.industry,
                j.apply_url, j.company_size, j.posted_at, j.description
         FROM jobs j
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      // ── Add match scores if user is authenticated ─────────────────────
      let userSkills: string[] = [];
      if (session) {
        userSkills = await getUserSkills(session.id, session.role);
      }

      const jobsWithMatch = rows.map((job: any) => {
        let skillsArr: string[] = [];
        try { skillsArr = JSON.parse(job.skills_required || '[]'); } catch { skillsArr = []; }

        const matchScore = userSkills.length > 0
          ? quickMatchScore(userSkills, job.skills_required)
          : null;

        return {
          ...job,
          skills_required: skillsArr,
          is_remote: !!job.is_remote,
          match_score: matchScore,
        };
      });

      // Sort by match score if requested and user is logged in
      if (sort === 'match' && userSkills.length > 0) {
        jobsWithMatch.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0));
      }

      return NextResponse.json({
        success: true,
        data: jobsWithMatch,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
        userSkillsCount: userSkills.length,
      });
    } finally { conn.release(); }
  } catch (error: any) {
    console.error('[Jobs API] Error:', error);
    // Gracefully handle missing table (first deploy before cron runs)
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.message?.includes("doesn't exist")) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false },
        userSkillsCount: 0,
        notice: 'Jobs table not yet populated. Click "Refresh Jobs" to load jobs.',
      });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
