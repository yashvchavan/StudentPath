import pool from "@/lib/db";
import { getStudentPlan, type FeatureKey, type PlanName } from "@/lib/subscriptions";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  plan: PlanName;
}

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
  // Sensible default daily limits if env vars are missing
  if (plan === "free") {
    switch (feature) {
      case "ai_chat":
        return 30;
      case "resume_analysis":
        return 3;
      case "career_track":
        return 5;
      case "recommendation":
        return 20;
    }
  }

  // Pro defaults
  if (plan === "pro") {
    switch (feature) {
      case "ai_chat":
        return 500;
      case "resume_analysis":
        return 50;
      case "career_track":
        return 100;
      case "recommendation":
        return 200;
    }
  }

  // College-sponsored Pro: slightly higher than individual Pro by default
  switch (feature) {
    case "ai_chat":
      return 1000;
    case "resume_analysis":
      return 100;
    case "career_track":
      return 200;
    case "recommendation":
      return 400;
  }
}

function getLimitFromEnv(feature: FeatureKey, plan: PlanName): number {
  const key = getEnvLimitKey(feature, plan);
  const raw = key ? process.env[key] : undefined;
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  }
  return defaultLimit(feature, plan);
}

export async function checkAndConsumeLimit(studentId: string, feature: FeatureKey): Promise<RateLimitResult> {
  const plan = await getStudentPlan(studentId);
  const limit = getLimitFromEnv(feature, plan);

  // If limit is 0, feature is effectively disabled for this plan.
  if (limit === 0) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      plan,
    };
  }

  // If limit is negative, treat as "unlimited"
  if (limit < 0) {
    return {
      allowed: true,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      plan,
    };
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const periodDate = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD

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
    };
  } finally {
    connection.release();
  }
}

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
