import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSubscriptionInfo } from "@/lib/subscriptions";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const info = await getSubscriptionInfo(String(user.id));

    return NextResponse.json({
      success: true,
      status: info.status,
      plan: info.plan,
      isProActive: info.isProActive,
      daysLeft: info.daysLeft,
      trialEndsAt: info.trialEndsAt?.toISOString() ?? null,
      periodEndsAt: info.periodEndsAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[subscription/status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
