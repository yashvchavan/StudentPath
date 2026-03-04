import pool from "@/lib/db";
import type { BillingPlan } from "@/lib/stripe";

export type PlanName = BillingPlan;

export type FeatureKey = "ai_chat" | "resume_analysis" | "career_track" | "recommendation";

export interface SubscriptionRecord {
  id: number;
  student_id: string;
  plan: PlanName;
  status: "inactive" | "active" | "trialing" | "past_due" | "canceled";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: Date | null;
  current_period_end: Date | null;
}

export async function getActiveSubscription(studentId: string): Promise<SubscriptionRecord | null> {
  const [rows]: any = await pool.execute(
    `SELECT *
     FROM subscriptions
     WHERE student_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [studentId]
  );

  if (!rows || rows.length === 0) return null;

  const sub = rows[0];
  if (!["active", "trialing", "past_due"].includes(sub.status)) {
    return null;
  }

  return sub as SubscriptionRecord;
}

export async function getStudentPlan(studentId: string): Promise<PlanName> {
  const sub = await getActiveSubscription(studentId);
  if (!sub) return "free";
  return sub.plan as PlanName;
}

