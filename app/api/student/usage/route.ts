/**
 * GET /api/student/usage
 *
 * Returns current usage counts and limits for all AI features
 * for the authenticated student. Read-only — does not consume limits.
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { checkCurrentUsage } from "@/lib/rate-limit";
import type { FeatureKey } from "@/lib/subscriptions";

const FEATURES: FeatureKey[] = ["ai_chat", "resume_analysis", "career_track", "recommendation"];

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = String(user.id);

    const usagePromises = FEATURES.map(async (feature) => {
      const result = await checkCurrentUsage(studentId, feature);
      return {
        feature,
        limit: result.limit,
        remaining: result.remaining,
        used: result.limit < 0 ? 0 : result.limit - result.remaining,
        allowed: result.allowed,
        plan: result.plan,
        resetDate: result.resetDate,
        periodType: feature === "career_track" || feature === "resume_analysis" ? "weekly" : "daily",
      };
    });

    const usage = await Promise.all(usagePromises);

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("[Student Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
