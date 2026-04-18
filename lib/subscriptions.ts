import pool from "@/lib/db";

export type PlanName = "free" | "pro" | "college_pro";

// What the client sees as the student's current plan state
export type SubscriptionStatus =
  | "trialing"       // Within 30-day free trial (all pro features active)
  | "active"         // Paid pro subscription active
  | "trial_expired"  // Trial ended, not yet subscribed
  | "expired"        // Past a paid subscription that ended
  | "free";          // No trial, no subscription (legacy / never created)

export type FeatureKey =
  | "ai_chat"
  | "resume_analysis"
  | "career_track"
  | "recommendation";

export interface SubscriptionRecord {
  id: number;
  student_id: string;
  plan: PlanName;
  status: "inactive" | "active" | "trialing" | "past_due" | "canceled";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  current_period_start: Date | null;
  current_period_end: Date | null;
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: PlanName;
  trialEndsAt: Date | null;
  periodEndsAt: Date | null;
  /** True when the student currently has full pro access (trial OR active paid) */
  isProActive: boolean;
  daysLeft: number | null;
}

// ─── Feature access definitions ───────────────────────────────────────────
/** Sidebar keys that are always free regardless of plan */
export const FREE_FEATURE_KEYS = new Set([
  "dashboard",
  "courses",
  "goals",
  "skills",
  "settings",
]);

/** Sidebar keys that require an active trial or paid pro plan */
export const PRO_FEATURE_KEYS = new Set([
  "career-tracks",
  "internships",
  "placement",
  "recommendations",
  "reports",
  "assistant",
  "resume",
  "notifications",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────
function diffDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** Resolve trial duration in days: platform_config → env → default 30 */
export async function getTrialDays(collegeId?: number): Promise<number> {
  try {
    // 1. Per-college config
    if (collegeId) {
      const [collegeRows]: any = await pool.execute(
        `SELECT config_value FROM platform_config
         WHERE config_key = 'free_trial_days' AND scope = 'college' AND college_id = ?
         LIMIT 1`,
        [collegeId]
      );
      if (collegeRows && collegeRows.length > 0) {
        const parsed = parseInt(collegeRows[0].config_value, 10);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    // 2. Global config from DB
    const [globalRows]: any = await pool.execute(
      `SELECT config_value FROM platform_config
       WHERE config_key = 'free_trial_days' AND scope = 'global'
       LIMIT 1`
    );
    if (globalRows && globalRows.length > 0) {
      const parsed = parseInt(globalRows[0].config_value, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Table may not exist yet
  }
  // 3. Env var
  const envVal = parseInt(process.env.FREE_TRIAL_DAYS || "", 10);
  if (!Number.isNaN(envVal) && envVal > 0) return envVal;
  // 4. Default
  return 30;
}

// ─── Core query: latest subscription row for a student ────────────────────
export async function getActiveSubscription(
  studentId: string
): Promise<SubscriptionRecord | null> {
  const [rows]: any = await pool.execute(
    `SELECT * FROM subscriptions
     WHERE student_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [studentId]
  );

  if (!rows || rows.length === 0) return null;
  const sub = rows[0];
  if (!["active", "trialing", "past_due"].includes(sub.status)) return null;
  return sub as SubscriptionRecord;
}

export async function getStudentPlan(studentId: string): Promise<PlanName> {
  const sub = await getActiveSubscription(studentId);
  if (!sub) return "free";
  return sub.plan as PlanName;
}

// ─── Rich subscription info (used by status API + sidebar) ────────────────
export async function getSubscriptionInfo(
  studentId: string
): Promise<SubscriptionInfo> {
  const now = new Date();

  // Fetch the latest subscription row (any status)
  const [rows]: any = await pool.execute(
    `SELECT s.* FROM subscriptions s
     WHERE s.student_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [studentId]
  );

  // Fallback: no subscription row — check registration date directly
  if (!rows || rows.length === 0) {
    const [studentRows]: any = await pool.execute(
      `SELECT created_at, college_id FROM Students WHERE student_id = ?`,
      [studentId]
    );
    if (studentRows && studentRows.length > 0) {
      const registeredAt = new Date(studentRows[0].created_at);
      const trialDays = await getTrialDays(studentRows[0].college_id || undefined);
      const trialEnd = new Date(
        registeredAt.getTime() + trialDays * 24 * 60 * 60 * 1000
      );
      if (now < trialEnd) {
        return {
          status: "trialing",
          plan: "pro",
          trialEndsAt: trialEnd,
          periodEndsAt: trialEnd,
          isProActive: true,
          daysLeft: diffDays(now, trialEnd),
        };
      }
    }
    return {
      status: "free",
      plan: "free",
      trialEndsAt: null,
      periodEndsAt: null,
      isProActive: false,
      daysLeft: null,
    };
  }

  const sub = rows[0];

  // ── Active paid pro ───────────────────────────────────────────────────
  if (
    sub.status === "active" &&
    sub.plan === "pro" &&
    sub.current_period_end
  ) {
    const periodEnd = new Date(sub.current_period_end);
    if (now < periodEnd) {
      return {
        status: "active",
        plan: "pro",
        trialEndsAt: null,
        periodEndsAt: periodEnd,
        isProActive: true,
        daysLeft: diffDays(now, periodEnd),
      };
    }
    // Paid plan expired
    return {
      status: "expired",
      plan: "free",
      trialEndsAt: null,
      periodEndsAt: periodEnd,
      isProActive: false,
      daysLeft: null,
    };
  }

  // ── Trialing ──────────────────────────────────────────────────────────
  if (sub.status === "trialing" && sub.current_period_end) {
    const trialEnd = new Date(sub.current_period_end);
    if (now < trialEnd) {
      return {
        status: "trialing",
        plan: "pro",
        trialEndsAt: trialEnd,
        periodEndsAt: trialEnd,
        isProActive: true,
        daysLeft: diffDays(now, trialEnd),
      };
    }
    return {
      status: "trial_expired",
      plan: "free",
      trialEndsAt: trialEnd,
      periodEndsAt: null,
      isProActive: false,
      daysLeft: null,
    };
  }

  // Default: no valid plan
  return {
    status: "free",
    plan: "free",
    trialEndsAt: null,
    periodEndsAt: null,
    isProActive: false,
    daysLeft: null,
  };
}

// ─── Create a trial subscription row on registration ──────────────────────
export async function createTrialSubscription(
  connection: any,
  studentId: number,
  collegeId?: number
): Promise<void> {
  const now = new Date();
  const trialDays = await getTrialDays(collegeId);
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  await connection.execute(
    `INSERT INTO subscriptions
      (student_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
     VALUES (?, 'pro', 'trialing', ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [studentId, now, trialEnd]
  );
}
