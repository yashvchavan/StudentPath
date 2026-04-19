/**
 * GET /api/razorpay/pricing
 * Public-ish endpoint (requires authenticated student session) that returns
 * the current pro plan pricing info from platform_config so the UI can
 * display it dynamically instead of using a hardcoded value.
 */

import { NextResponse } from "next/server";
import { getTrialDays } from "@/lib/subscriptions";
import { getProPlanPricingConfig } from "@/lib/razorpay";

export async function GET() {
  try {
    const [pricing, trialDays] = await Promise.all([
      getProPlanPricingConfig(),
      getTrialDays(),
    ]);

    return NextResponse.json({
      success: true,
      displayPrice: pricing.displayPrice,
      rawPrice: String(pricing.amountMinor / 100),
      currency: pricing.currency,
      trialDays,
      label: pricing.displayLabel,
    });
  } catch (error) {
    console.error("[razorpay/pricing] Error:", error);
    // Return safe defaults so the UI never breaks
    return NextResponse.json({
      success: false,
      displayPrice: "$3.21",
      rawPrice: "3.21",
      currency: "USD",
      trialDays: 30,
      label: "per year",
    });
  }
}
