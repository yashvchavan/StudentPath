/**
 * DEV-ONLY endpoint — NOT for production.
 * Lets you force-set a student's subscription state for testing.
 *
 * Usage (while logged in as a student):
 *
 *   Expire the trial immediately:
 *   POST /api/dev/set-subscription  { "action": "expire_trial" }
 *
 *   Restore a fresh 30-day trial:
 *   POST /api/dev/set-subscription  { "action": "restore_trial" }
 *
 *   Activate a paid pro subscription (1 year):
 *   POST /api/dev/set-subscription  { "action": "activate_pro" }
 *
 *   Expire the paid pro subscription:
 *   POST /api/dev/set-subscription  { "action": "expire_pro" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// Block this route entirely in production
if (process.env.NODE_ENV === "production") {
  console.warn("[dev/set-subscription] This route is disabled in production.");
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const user = await getAuthUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  const studentId = String(user.id);
  const now = new Date();

  let plan: string;
  let status: string;
  let periodStart: Date;
  let periodEnd: Date;
  let label: string;

  switch (action) {
    case "expire_trial":
      // Set period_end 2 days in the past → trial looks expired
      plan = "pro";
      status = "trialing";
      periodStart = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);
      periodEnd   = new Date(now.getTime() -  2 * 24 * 60 * 60 * 1000);
      label = "Trial expired (2 days ago)";
      break;

    case "restore_trial":
      // Fresh 30-day trial from now
      plan = "pro";
      status = "trialing";
      periodStart = now;
      periodEnd   = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      label = "Trial restored (30 days)";
      break;

    case "activate_pro":
      // Paid pro, valid for 1 year
      plan = "pro";
      status = "active";
      periodStart = now;
      periodEnd   = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      label = "Pro activated (1 year)";
      break;

    case "expire_pro":
      // Paid pro that ended 2 days ago
      plan = "pro";
      status = "active";
      periodStart = new Date(now.getTime() - 367 * 24 * 60 * 60 * 1000);
      periodEnd   = new Date(now.getTime() -   2 * 24 * 60 * 60 * 1000);
      label = "Pro expired (2 days ago)";
      break;

    default:
      return NextResponse.json(
        { error: `Unknown action "${action}". Use: expire_trial | restore_trial | activate_pro | expire_pro` },
        { status: 400 }
      );
  }

  // Upsert: update latest row or insert fresh one
  const [updateResult]: any = await pool.execute(
    `UPDATE subscriptions
     SET plan = ?, status = ?, current_period_start = ?, current_period_end = ?, updated_at = NOW()
     WHERE student_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [plan, status, periodStart, periodEnd, studentId]
  );

  if (!updateResult || updateResult.affectedRows === 0) {
    await pool.execute(
      `INSERT INTO subscriptions (student_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [studentId, plan, status, periodStart, periodEnd]
    );
  }

  return NextResponse.json({
    success: true,
    label,
    student_id: studentId,
    plan,
    status,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
  });
}
