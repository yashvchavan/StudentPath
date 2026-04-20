/**
 * lib/jobs/jobScraper.ts
 *
 * Fetches jobs from 3 100%-free public APIs (no API key required):
 *   1. Remotive     — https://remotive.com/api/remote-jobs
 *   2. Himalayas    — https://himalayas.app/jobs/api
 *   3. The Muse     — https://www.themuse.com/api/public/jobs
 *
 * Maps each source's schema to a unified Job record and upserts into
 * the `jobs` table via INSERT ... ON DUPLICATE KEY UPDATE.
 *
 * Called by:  POST /api/jobs/refresh  (Vercel daily cron)
 */

import pool from '@/lib/db';
import type { ResultSetHeader } from 'mysql2/promise';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapedJob {
  external_id: string;
  source: 'remotive' | 'himalayas' | 'muse';
  type: 'internship' | 'fresher' | 'experienced';
  job_level: 'junior' | 'mid' | 'senior' | 'lead' | 'any';
  title: string;
  company: string;
  logo_url: string | null;
  location: string;
  is_remote: boolean;
  salary: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  min_experience: number;
  max_experience: number | null;
  skills_required: string[];
  category: string | null;
  description: string;
  apply_url: string;
  company_size: string | null;
  industry: string | null;
  posted_at: Date | null;
  expires_at: Date | null;
}

export interface ScrapeSourceResult {
  source: string;
  jobs_fetched: number;
  jobs_inserted: number;
  jobs_updated: number;
  duration_ms: number;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferJobType(title: string, category: string): 'internship' | 'fresher' | 'experienced' {
  const t = title.toLowerCase();
  const c = (category || '').toLowerCase();
  if (t.includes('intern') || c.includes('intern')) return 'internship';
  if (t.includes('junior') || t.includes('entry') || t.includes('fresher') || t.includes('graduate')) return 'fresher';
  return 'experienced';
}

function inferJobLevel(title: string): 'junior' | 'mid' | 'senior' | 'lead' | 'any' {
  const t = title.toLowerCase();
  if (t.includes('lead') || t.includes('principal') || t.includes('staff')) return 'lead';
  if (t.includes('senior') || t.includes('sr.') || t.includes('sr ')) return 'senior';
  if (t.includes('junior') || t.includes('jr.') || t.includes('entry') || t.includes('intern') || t.includes('fresher')) return 'junior';
  if (t.includes('mid') || t.includes('middle')) return 'mid';
  return 'any';
}

function parseSalary(raw: string | null): { salary_min: number | null; salary_max: number | null; currency: string } {
  if (!raw) return { salary_min: null, salary_max: null, currency: 'USD' };
  const nums = raw.replace(/,/g, '').match(/\d+/g)?.map(Number) || [];
  const currency = raw.includes('₹') || raw.toLowerCase().includes('inr') ? 'INR'
    : raw.includes('£') ? 'GBP'
    : raw.includes('€') ? 'EUR'
    : 'USD';
  return { salary_min: nums[0] ?? null, salary_max: nums[1] ?? null, currency };
}

function extractSkills(text: string): string[] {
  const techTerms = [
    'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Ruby','PHP','Swift',
    'Kotlin','React','Angular','Vue','Next.js','Node.js','Express','Django','Flask','Spring',
    'Docker','Kubernetes','AWS','GCP','Azure','PostgreSQL','MySQL','MongoDB','Redis','GraphQL',
    'REST','Git','Linux','Machine Learning','TensorFlow','PyTorch','SQL','Figma','Tailwind',
  ];
  const found = new Set<string>();
  for (const term of techTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) found.add(term);
  }
  return Array.from(found);
}

// ─── Source 1: Remotive ───────────────────────────────────────────────────────

async function fetchRemotive(): Promise<ScrapedJob[]> {
  const res = await fetch('https://remotive.com/api/remote-jobs?limit=200', {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000),
    next: { revalidate: 0 },
  } as RequestInit);

  if (!res.ok) throw new Error(`Remotive API returned ${res.status}`);
  const data = await res.json();
  const jobs: any[] = data.jobs || [];

  return jobs.map((j: any): ScrapedJob => {
    const type = inferJobType(j.title || '', j.category || '');
    const level = inferJobLevel(j.title || '');
    const salaryInfo = parseSalary(j.salary || null);
    const tags: string[] = Array.isArray(j.tags) ? j.tags : [];
    const techSkills = extractSkills((j.description || '') + ' ' + tags.join(' '));

    return {
      external_id: String(j.id).slice(0, 250),
      source: 'remotive',
      type,
      job_level: level,
      title: (j.title || 'Position').slice(0, 490),
      company: (j.company_name || 'Unknown').slice(0, 490),
      logo_url: (j.company_logo || null)?.slice(0, 490) ?? null,
      location: (j.candidate_required_location || 'Remote').slice(0, 490),
      is_remote: true,
      salary: (j.salary || null)?.slice(0, 95) ?? null,
      ...salaryInfo,
      min_experience: level === 'junior' ? 0 : level === 'mid' ? 2 : level === 'senior' ? 4 : 0,
      max_experience: level === 'junior' ? 2 : level === 'mid' ? 5 : null,
      skills_required: [...new Set([...tags.map(t => t.trim()), ...techSkills])].filter(Boolean).slice(0, 20),
      category: (j.category || null)?.slice(0, 190) ?? null,
      description: (j.description || '').slice(0, 3000),
      apply_url: (j.url || '').slice(0, 490),
      company_size: null,
      industry: (j.category || null)?.slice(0, 190) ?? null,
      posted_at: j.publication_date ? new Date(j.publication_date) : null,
      expires_at: null,
    };
  }).filter(j => j.apply_url);
}

// ─── Source 2: Himalayas ──────────────────────────────────────────────────────

async function fetchHimalayas(): Promise<ScrapedJob[]> {
  const res = await fetch('https://himalayas.app/jobs/api?limit=200&offset=0', {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000),
    next: { revalidate: 0 },
  } as RequestInit);

  if (!res.ok) throw new Error(`Himalayas API returned ${res.status}`);
  const data = await res.json();
  const jobs: any[] = data.jobs || [];

  return jobs.map((j: any): ScrapedJob => {
    const type = inferJobType(j.title || '', '');
    const level = inferJobLevel(j.title || '');
    const salaryInfo = parseSalary(j.salary || null);

    const requiredSkills: string[] = [
      ...(j.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name || '')),
      ...extractSkills(j.descriptionMd || j.description || ''),
    ].filter(Boolean);

    // Himalayas locationRestrictions can be very long (many countries).
    // Cap it so it fits the VARCHAR(500) column.
    const rawLocation = j.locationRestrictions?.join(', ') || 'Remote';
    const location = rawLocation.length > 490
      ? rawLocation.slice(0, 487) + '...'
      : rawLocation;

    return {
      external_id: (`h-${j.slug || j.id}`).slice(0, 250),
      source: 'himalayas',
      type,
      job_level: level,
      title: (j.title || 'Software Engineer').slice(0, 490),
      company: (j.company?.name || j.companyName || 'Unknown').slice(0, 490),
      logo_url: (j.company?.logoUrl || j.companyLogo || null)?.slice(0, 490) ?? null,
      location,
      is_remote: true,
      salary: (j.salary || null)?.slice(0, 95) ?? null,
      ...salaryInfo,
      min_experience: level === 'junior' ? 0 : level === 'mid' ? 2 : level === 'senior' ? 4 : 0,
      max_experience: level === 'junior' ? 2 : level === 'mid' ? 5 : null,
      skills_required: [...new Set(requiredSkills)].slice(0, 20),
      category: (j.category || null)?.slice(0, 190) ?? null,
      description: (j.descriptionMd || j.description || '').slice(0, 3000),
      apply_url: (j.applicationLink || j.url || '').slice(0, 490),
      company_size: (j.company?.size || null)?.slice(0, 190) ?? null,
      industry: (j.category || null)?.slice(0, 190) ?? null,
      posted_at: j.createdAt ? new Date(j.createdAt) : null,
      expires_at: null,
    };
  }).filter(j => j.apply_url);
}

// ─── Source 3: The Muse ───────────────────────────────────────────────────────

async function fetchMuse(): Promise<ScrapedJob[]> {
  const res = await fetch('https://www.themuse.com/api/public/jobs?page=0&descending=true', {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000),
    next: { revalidate: 0 },
  } as RequestInit);

  if (!res.ok) throw new Error(`The Muse API returned ${res.status}`);
  const data = await res.json();
  const results: any[] = data.results || [];

  return results.map((j: any): ScrapedJob => {
    const level = (j.levels?.[0]?.name || '').toLowerCase();
    const jobLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'any' =
      level.includes('intern') ? 'junior'
      : level.includes('entry') || level.includes('junior') ? 'junior'
      : level.includes('mid') ? 'mid'
      : level.includes('senior') ? 'senior'
      : level.includes('lead') ? 'lead'
      : 'any';

    const type = inferJobType(j.name || '', level);
    const desc = (j.contents || '').replace(/<[^>]+>/g, ' ');
    const skills = extractSkills(desc);
    const locationName = j.locations?.[0]?.name || 'Flexible';

    return {
      external_id: `muse-${j.id}`,
      source: 'muse',
      type,
      job_level: jobLevel,
      title: (j.name || 'Position').slice(0, 490),
      company: (j.company?.name || 'Unknown').slice(0, 490),
      logo_url: null,
      location: locationName.slice(0, 490),
      is_remote: locationName.toLowerCase().includes('remote') || locationName.toLowerCase().includes('flexible'),
      salary: null,
      salary_min: null,
      salary_max: null,
      currency: 'USD',
      min_experience: jobLevel === 'junior' ? 0 : jobLevel === 'mid' ? 2 : jobLevel === 'senior' ? 4 : 0,
      max_experience: jobLevel === 'junior' ? 2 : null,
      skills_required: skills.slice(0, 20),
      category: (j.categories?.[0]?.name || null)?.slice(0, 190) ?? null,
      description: desc.slice(0, 3000),
      apply_url: (j.refs?.landing_page || '').slice(0, 490),
      company_size: null,
      industry: (j.categories?.[0]?.name || null)?.slice(0, 190) ?? null,
      posted_at: j.publication_date ? new Date(j.publication_date) : null,
      expires_at: null,
    };
  }).filter(j => j.apply_url) as ScrapedJob[];
}

// ─── DB upsert ────────────────────────────────────────────────────────────────

async function upsertJobs(jobs: ScrapedJob[]): Promise<{ inserted: number; updated: number }> {
  if (!jobs.length) return { inserted: 0, updated: 0 };
  const connection = await pool.getConnection();
  let inserted = 0;
  let updated = 0;

  try {
    for (const job of jobs) {
      const result = await connection.execute<ResultSetHeader>(
        `INSERT INTO jobs 
          (external_id, source, type, job_level, title, company, logo_url, location,
           is_remote, salary, salary_min, salary_max, currency, min_experience, max_experience,
           skills_required, category, description, apply_url, company_size, industry,
           posted_at, expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           company = VALUES(company),
           logo_url = VALUES(logo_url),
           salary = VALUES(salary),
           salary_min = VALUES(salary_min),
           salary_max = VALUES(salary_max),
           skills_required = VALUES(skills_required),
           description = VALUES(description),
           is_active = TRUE,
           updated_at = CURRENT_TIMESTAMP`,
        [
          job.external_id, job.source, job.type, job.job_level,
          job.title, job.company, job.logo_url, job.location,
          job.is_remote ? 1 : 0,
          job.salary, job.salary_min, job.salary_max,
          job.currency,
          job.min_experience, job.max_experience,
          JSON.stringify(job.skills_required),
          job.category, job.description, job.apply_url,
          job.company_size, job.industry,
          job.posted_at, job.expires_at,
        ]
      );
      const header = Array.isArray(result) ? result[0] : result;
      if ((header as any).affectedRows === 1) inserted++;
      else if ((header as any).affectedRows === 2) updated++;
    }
  } finally {
    connection.release();
  }

  return { inserted, updated };
}

async function logScrapeRun(result: ScrapeSourceResult, runId: string): Promise<void> {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.execute(
        `INSERT INTO job_scrape_logs (run_id, source, jobs_fetched, jobs_inserted, jobs_updated, error_msg, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [runId, result.source, result.jobs_fetched, result.jobs_inserted, result.jobs_updated, result.error || null, result.duration_ms]
      );
    } finally {
      conn.release();
    }
  } catch { /* log failures shouldn't abort the run */ }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface ScrapeRunResult {
  runId: string;
  ranAt: string;
  sources: ScrapeSourceResult[];
  totalInserted: number;
  totalUpdated: number;
  totalFetched: number;
}

export async function runJobScraper(): Promise<ScrapeRunResult> {
  const runId = `scrape-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ranAt = new Date().toISOString();
  const sourceResults: ScrapeSourceResult[] = [];

  const sources: Array<{ name: string; fn: () => Promise<ScrapedJob[]> }> = [
    { name: 'remotive', fn: fetchRemotive },
    { name: 'himalayas', fn: fetchHimalayas },
    { name: 'muse', fn: fetchMuse },
  ];

  for (const src of sources) {
    const start = Date.now();
    try {
      console.log(`[JobScraper] Fetching ${src.name}...`);
      const jobs = await src.fn();
      const { inserted, updated } = await upsertJobs(jobs);
      const result: ScrapeSourceResult = {
        source: src.name,
        jobs_fetched: jobs.length,
        jobs_inserted: inserted,
        jobs_updated: updated,
        duration_ms: Date.now() - start,
      };
      sourceResults.push(result);
      await logScrapeRun(result, runId);
      console.log(`[JobScraper] ${src.name}: ${jobs.length} fetched, ${inserted} inserted, ${updated} updated`);
    } catch (err: any) {
      console.error(`[JobScraper] ${src.name} failed:`, err.message);
      const result: ScrapeSourceResult = {
        source: src.name, jobs_fetched: 0, jobs_inserted: 0, jobs_updated: 0,
        duration_ms: Date.now() - start, error: err.message,
      };
      sourceResults.push(result);
      await logScrapeRun(result, runId);
    }
  }

  // Mark old jobs (not updated in 3 days) as inactive
  try {
    const conn = await pool.getConnection();
    try {
      await conn.execute(`UPDATE jobs SET is_active = FALSE WHERE updated_at < DATE_SUB(NOW(), INTERVAL 3 DAY)`);
    } finally { conn.release(); }
  } catch { /* ignore */ }

  return {
    runId,
    ranAt,
    sources: sourceResults,
    totalFetched: sourceResults.reduce((s, r) => s + r.jobs_fetched, 0),
    totalInserted: sourceResults.reduce((s, r) => s + r.jobs_inserted, 0),
    totalUpdated: sourceResults.reduce((s, r) => s + r.jobs_updated, 0),
  };
}
