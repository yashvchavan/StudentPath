/**
 * /api/professionals/skills
 * GET  — return professional's skills
 * POST  — sync from GitHub and update profile
 * PATCH — update skills array directly
 */

import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function getAuthId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload.id as number;
  } catch { return null; }
}

const TECH_TERMS = [
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Ruby','PHP','Swift',
  'Kotlin','React','Angular','Vue','Next.js','Node.js','Express','Django','Flask','Spring',
  'Docker','Kubernetes','AWS','GCP','Azure','PostgreSQL','MySQL','MongoDB','Redis','GraphQL',
  'REST','Git','Linux','TensorFlow','PyTorch','SQL','Tailwind','Figma','CSS','HTML',
  'System Design','Agile','Scrum','CI/CD','Terraform','Nginx','Jenkins',
];

async function extractSkillsFromGitHub(username: string): Promise<string[]> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`, {
    headers: { 'Accept': 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(10000),
  } as RequestInit);

  if (!res.ok) return [];
  const repos: any[] = await res.json();

  const langCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + (repo.stargazers_count + 1);
  }

  const languages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)
    .filter(l => TECH_TERMS.some(t => t.toLowerCase() === l.toLowerCase()))
    .slice(0, 10);

  const topics = repos.flatMap(r => r.topics || [])
    .map((t: string) => t.replace(/-/g, '').toLowerCase());

  const additionalSkills = TECH_TERMS.filter(term =>
    topics.some(topic => topic.includes(term.toLowerCase().replace(/[^a-z]/g, '')))
  ).slice(0, 10);

  return [...new Set([...languages, ...additionalSkills])];
}

export async function GET(req: NextRequest) {
  const id = await getAuthId(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conn = await pool.getConnection();
  try {
    const [rows]: any = await conn.execute(
      `SELECT skill_name as skillName, proficiency, confidence, sources, updated_at as updatedAt
       FROM professional_skills
       WHERE professional_id = ?
       ORDER BY proficiency DESC, confidence DESC`,
      [id]
    );

    // If professional_skills is populated, use that
    if (rows && rows.length > 0) {
      const formattedSkills = rows.map((r: any) => ({
        ...r,
        sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : r.sources
      }));
      return NextResponse.json({ success: true, skills: formattedSkills });
    }

    // Fallback to the string array on the professionals table
    const [profRows]: any = await conn.execute(`SELECT skills FROM professionals WHERE id = ?`, [id]);
    if (!profRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    let skills: string[] = [];
    try { skills = JSON.parse(profRows[0].skills || '[]'); } catch { skills = []; }
    
    // Map simple string skills to a format the UI expects for fallback
    const fallbackSkills = skills.map(s => ({
      skillName: s,
      proficiency: 5,
      confidence: 0.5,
      sources: ["manual"],
      updatedAt: new Date().toISOString()
    }));

    return NextResponse.json({ success: true, skills: fallbackSkills });
  } catch (err: any) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      // Table might not exist yet, fallback to simple string array
      const [profRows]: any = await conn.execute(`SELECT skills FROM professionals WHERE id = ?`, [id]);
      if (!profRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      let skills: string[] = [];
      try { skills = JSON.parse(profRows[0].skills || '[]'); } catch { skills = []; }
      
      const fallbackSkills = skills.map(s => ({
        skillName: s,
        proficiency: 5,
        confidence: 0.5,
        sources: ["manual"],
        updatedAt: new Date().toISOString()
      }));

      return NextResponse.json({ success: true, skills: fallbackSkills });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally { 
    conn.release(); 
  }
}

export async function POST(req: NextRequest) {
  const id = await getAuthId(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const github = url.searchParams.get('github');
  if (!github) return NextResponse.json({ error: 'github param required' }, { status: 400 });

  try {
    const githubSkills = await extractSkillsFromGitHub(github);
    if (!githubSkills.length) {
      return NextResponse.json({ error: 'No skills found for that GitHub user. Make sure the username is correct and the account has public repos.' }, { status: 404 });
    }

    // Merge with existing skills
    const conn = await pool.getConnection();
    try {
      const [rows]: any = await conn.execute(`SELECT skills, github FROM professionals WHERE id = ?`, [id]);
      let existing: string[] = [];
      try { existing = JSON.parse(rows[0]?.skills || '[]'); } catch { existing = []; }
      const merged = [...new Set([...existing, ...githubSkills])];

      await conn.execute(`UPDATE professionals SET skills = ?, github = COALESCE(NULLIF(github, ''), ?) WHERE id = ?`,
        [JSON.stringify(merged), github, id]);

      return NextResponse.json({ success: true, skills: merged, synced: githubSkills });
    } finally { conn.release(); }
  } catch (error: any) {
    console.error('[ProfSkills POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const id = await getAuthId(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { skills } = await req.json();
  if (!Array.isArray(skills)) return NextResponse.json({ error: 'skills array required' }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.execute(`UPDATE professionals SET skills = ? WHERE id = ?`, [JSON.stringify(skills), id]);
    return NextResponse.json({ success: true });
  } finally { conn.release(); }
}
