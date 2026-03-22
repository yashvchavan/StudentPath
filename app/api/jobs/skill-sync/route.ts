/**
 * POST /api/jobs/skill-sync
 *
 * Vercel Cron endpoint — runs the monthly student skill sync job.
 *
 * Schedule (vercel.json):
 *   "0 2 1 * *"  →  02:00 UTC on the 1st of every month
 *
 * Security:
 *   Vercel automatically sends the  Authorization: Bearer <CRON_SECRET>
 *   header. The same secret can be used to trigger a manual run:
 *
 *   curl -X POST https://your-app.vercel.app/api/jobs/skill-sync \
 *        -H "Authorization: Bearer <CRON_SECRET>"
 *
 * GET /api/jobs/skill-sync
 *   Returns the last 10 run logs (admin view, same auth required).
 */

import { NextRequest, NextResponse } from "next/server";
import { runSkillSyncJob, getRecentSyncLogs } from "@/lib/jobs/skillSync";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is set, only allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── POST — run the sync job ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[API /api/jobs/skill-sync] Cron job triggered.");

  try {
    const result = await runSkillSyncJob();

    return NextResponse.json({
      success:    true,
      message:    `Skill sync complete. ${result.succeeded} students updated, ${result.failed} failed.`,
      runId:      result.runId,
      startedAt:  result.startedAt,
      finishedAt: result.finishedAt,
      stats: {
        total:     result.totalStudents,
        succeeded: result.succeeded,
        skipped:   result.skipped,
        failed:    result.failed,
        skillRows: result.totalSkillRows,
      },
      // Only include per-student detail in dev to keep response size small
      ...(process.env.NODE_ENV === "development"
        ? { results: result.results }
        : {}),
    });

  } catch (err: any) {
    console.error("[API /api/jobs/skill-sync] Job crashed:", err);
    return NextResponse.json(
      { error: "Skill sync job crashed.", detail: err?.message },
      { status: 500 }
    );
  }
}

// ─── GET — fetch recent run logs ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit      = Math.min(Number(limitParam ?? 10), 50);
    const logs       = await getRecentSyncLogs(limit);

    return NextResponse.json({
      success: true,
      count:   logs.length,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch sync logs.", detail: err?.message },
      { status: 500 }
    );
  }
}
