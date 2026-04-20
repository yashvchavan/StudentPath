/**
 * POST /api/jobs/refresh
 *
 * Triggers the job scraper. Access is allowed if ANY of these is true:
 *   1. No CRON_SECRET set (dev mode — open)
 *   2. Request carries a valid CRON_SECRET header (production cron)
 *   3. Request carries a valid auth_session JWT (logged-in student or professional)
 */

import { NextResponse, NextRequest } from 'next/server';
import { runJobScraper } from '@/lib/jobs/jobScraper';
import { initializeDatabase } from '@/lib/db';
import { jwtVerify } from 'jose';

export const maxDuration = 300; // 5 min max for Vercel functions

const jwtKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, jwtKey);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // ── Authorization check (pass if ANY method succeeds) ─────────────────────
  if (cronSecret) {
    // Check CRON_SECRET header first (Vercel cron / server-to-server)
    const authHeader = req.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || req.headers.get('x-cron-secret');
    const hasCronSecret = providedSecret === cronSecret;

    // Also allow authenticated users (students / professionals via browser)
    const hasSession = await isAuthenticated(req);

    if (!hasCronSecret && !hasSession) {
      return NextResponse.json(
        { error: 'Unauthorized — provide CRON_SECRET header or log in first' },
        { status: 401 }
      );
    }
  }
  // If CRON_SECRET is not set, allow everyone (dev mode)

  try {
    console.log('[JobRefresh] Starting job scrape...');
    await initializeDatabase();
    const result = await runJobScraper();
    console.log(`[JobRefresh] Done — fetched:${result.totalFetched} inserted:${result.totalInserted} updated:${result.totalUpdated}`);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[JobRefresh] Scrape failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Vercel sends GET for cron routes
export async function GET(req: NextRequest) {
  return POST(req);
}
