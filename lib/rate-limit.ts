import pool from "@/lib/db";
import { getStudentPlan, type FeatureKey, type PlanName } from "@/lib/subscriptions";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  plan: PlanName;
  resetDate: string | null; // ISO date string for when the limit resets
}

// ─── Period helpers ───────────────────────────────────────────────────────────

/** Returns the Monday of the current ISO week as YYYY-MM-DD */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns the next Monday (reset date for weekly features) as YYYY-MM-DD */
function getNextWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + diff);
  const yyyy = nextMonday.getFullYear();
  const mm = String(nextMonday.getMonth() + 1).padStart(2, "0");
  const dd = String(nextMonday.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns today's date as YYYY-MM-DD */
function getToday(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns tomorrow's date as YYYY-MM-DD */
function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Feature period configuration ─────────────────────────────────────────────

/** Determine whether a feature uses weekly or daily periods */
function isWeeklyFeature(feature: FeatureKey): boolean {
  return feature === "career_track" || feature === "resume_analysis";
}

function getPeriodDate(feature: FeatureKey): string {
  return isWeeklyFeature(feature) ? getWeekStart() : getToday();
}

function getResetDate(feature: FeatureKey): string {
  return isWeeklyFeature(feature) ? getNextWeekStart() : getTomorrow();
}

// ─── Limit resolution: DB config → env → defaults ─────────────────────────────

function getEnvLimitKey(feature: FeatureKey, plan: PlanName): string {
  const planSuffix = plan === "free" ? "FREE" : plan === "pro" ? "PRO" : "COLLEGE_PRO";

  switch (feature) {
    case "ai_chat":
      return `AI_CHAT_${planSuffix}_LIMIT`;
    case "resume_analysis":
      return `RESUME_ANALYSIS_${planSuffix}_LIMIT`;
    case "career_track":
      return `CAREER_TRACK_${planSuffix}_LIMIT`;
    case "recommendation":
      return `RECOMMENDATION_${planSuffix}_LIMIT`;
    default:
      return "";
  }
}

function defaultLimit(feature: FeatureKey, plan: PlanName): number {
  // Weekly defaults for career_track and resume_analysis
  if (feature === "career_track") {
    if (plan === "free") return 1;       // 1 plan per week (free trial)
    if (plan === "pro") return 4;        // 4 plans per week (pro)
    return 6;                            // college_pro
  }
  if (feature === "resume_analysis") {
    if (plan === "free") return 1;       // 1 analysis per week (free trial)
    if (plan === "pro") return 5;        // 5 per week (pro)
    return 10;                           // college_pro
  }

  // Daily defaults for ai_chat and recommendation
  if (plan === "free") {
    switch (feature) {
      case "ai_chat":
        return 30;
      case "recommendation":
        return 20;
    }
  }

  if (plan === "pro") {
    switch (feature) {
      case "ai_chat":
        return 500;
      case "recommendation":
        return 200;
    }
  }

  // College-sponsored Pro
  switch (feature) {
    case "ai_chat":
      return 1000;
    case "recommendation":
      return 400;
  }

  return 10; // fallback
}

/** Try to read limit from platform_config DB table */
async function getDbConfigLimit(feature: FeatureKey, plan: PlanName, collegeId?: number): Promise<number | null> {
  try {
    const configKey = `rate_limit_${feature}_${plan}`;

    // If college-specific, try that first
    if (collegeId) {
      const [collegeRows]: any = await pool.execute(
        `SELECT config_value FROM platform_config
         WHERE config_key = ? AND scope = 'college' AND college_id = ?
         LIMIT 1`,
        [configKey, collegeId]
      );
      if (collegeRows && collegeRows.length > 0) {
        const parsed = parseInt(collegeRows[0].config_value, 10);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }

    // Then try global
    const [rows]: any = await pool.execute(
      `SELECT config_value FROM platform_config
       WHERE config_key = ? AND scope = 'global' AND college_id IS NULL
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [configKey]
    );
    if (rows && rows.length > 0) {
      const parsed = parseInt(rows[0].config_value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // Table may not exist yet — fall through
  }
  return null;
}

function getEnvLimit(feature: FeatureKey, plan: PlanName): number | null {
  const key = getEnvLimitKey(feature, plan);
  const raw = key ? process.env[key] : undefined;
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

async function resolveLimit(feature: FeatureKey, plan: PlanName, collegeId?: number): Promise<number> {
  // 1. DB config (most specific)
  const dbLimit = await getDbConfigLimit(feature, plan, collegeId);
  if (dbLimit !== null) return dbLimit;

  // 2. Env var
  const envLimit = getEnvLimit(feature, plan);
  if (envLimit !== null) return envLimit;

  // 3. Default
  return defaultLimit(feature, plan);
}

// ─── Core rate-limiting function ──────────────────────────────────────────────

export async function checkAndConsumeLimit(studentId: string, feature: FeatureKey): Promise<RateLimitResult> {
  const plan = await getStudentPlan(studentId);
  
  // Try to resolve college_id for per-college config
  let collegeId: number | undefined;
  try {
    const [rows]: any = await pool.execute(
      `SELECT college_id FROM Students WHERE student_id = ? LIMIT 1`,
      [studentId]
    );
    if (rows && rows.length > 0 && rows[0].college_id) {
      collegeId = rows[0].college_id;
    }
  } catch { /* ignore */ }

  const limit = await resolveLimit(feature, plan, collegeId);
  const resetDate = getResetDate(feature);

  // If limit is 0, feature is effectively disabled for this plan.
  if (limit === 0) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      plan,
      resetDate,
    };
  }

  // If limit is negative, treat as "unlimited"
  if (limit < 0) {
    return {
      allowed: true,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      plan,
      resetDate: null,
    };
  }

  const periodDate = getPeriodDate(feature);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows]: any = await connection.execute(
      `SELECT id, usage_count
       FROM feature_usage
       WHERE student_id = ? AND feature = ? AND plan = ? AND period_start = ?
       FOR UPDATE`,
      [studentId, feature, plan, periodDate]
    );

    if (!rows || rows.length === 0) {
      // First usage for this period
      await connection.execute(
        `INSERT INTO feature_usage (student_id, feature, plan, period_start, period_end, usage_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, feature, plan, periodDate, periodDate, 1]
      );

      await connection.commit();
      return {
        allowed: true,
        limit,
        remaining: Math.max(limit - 1, 0),
        plan,
        resetDate,
      };
    }

    const current = rows[0];
    const currentCount: number = current.usage_count ?? 0;

    if (currentCount >= limit) {
      await connection.rollback();
      return {
        allowed: false,
        limit,
        remaining: 0,
        plan,
        resetDate,
      };
    }

    const newCount = currentCount + 1;

    await connection.execute(
      `UPDATE feature_usage
       SET usage_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newCount, current.id]
    );

    await connection.commit();

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - newCount, 0),
      plan,
      resetDate,
    };
  } catch (err) {
    await connection.rollback();
    console.error("[RateLimit] Failed to update usage:", err);
    // On failure, be conservative and block to avoid runaway costs.
    return {
      allowed: false,
      limit,
      remaining: 0,
      plan: await getStudentPlan(studentId),
      resetDate,
    };
  } finally {
    connection.release();
  }
}

// ─── Check usage without consuming (read-only) ───────────────────────────────

export async function checkCurrentUsage(studentId: string, feature: FeatureKey): Promise<RateLimitResult> {
  const plan = await getStudentPlan(studentId);

  let collegeId: number | undefined;
  try {
    const [rows]: any = await pool.execute(
      `SELECT college_id FROM Students WHERE student_id = ? LIMIT 1`,
      [studentId]
    );
    if (rows && rows.length > 0 && rows[0].college_id) {
      collegeId = rows[0].college_id;
    }
  } catch { /* ignore */ }

  const limit = await resolveLimit(feature, plan, collegeId);
  const resetDate = getResetDate(feature);

  if (limit < 0) {
    return { allowed: true, limit, remaining: Number.POSITIVE_INFINITY, plan, resetDate: null };
  }

  const periodDate = getPeriodDate(feature);

  try {
    const [rows]: any = await pool.execute(
      `SELECT usage_count FROM feature_usage
       WHERE student_id = ? AND feature = ? AND plan = ? AND period_start = ?
       LIMIT 1`,
      [studentId, feature, plan, periodDate]
    );

    const currentCount = rows && rows.length > 0 ? (rows[0].usage_count ?? 0) : 0;
    const remaining = Math.max(limit - currentCount, 0);

    return {
      allowed: remaining > 0,
      limit,
      remaining,
      plan,
      resetDate: remaining > 0 ? null : resetDate,
    };
  } catch {
    return { allowed: true, limit, remaining: limit, plan, resetDate: null };
  }
}

// ─── IP-based rate limiter (for middleware) ────────────────────────────────────

import { NextRequest } from 'next/server';

const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

/**
 * Basic in-memory rate limiter.
 * Note: In a serverless environment, this state is not shared across lambda instances.
 * For production, use Redis (e.g., Upstash).
 * 
 * @param request NextRequest
 * @param limit Max requests per window
 * @param windowMs Time window in milliseconds (default 60s)
 * @returns true if allowed, false if limit exceeded
 */
export function checkRateLimit(request: NextRequest, limit: number = 5, windowMs: number = 60000): boolean {
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    const record = rateLimitStore.get(ip) || { count: 0, lastReset: now };

    // Reset if window passed
    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }

    record.count += 1;
    rateLimitStore.set(ip, record);

    return record.count <= limit;
}
