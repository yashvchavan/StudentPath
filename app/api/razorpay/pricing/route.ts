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
    // Try to return live config even on partial failure; ultimate fallback is env/defaults
    try {
      const [fallbackPricing, fallbackTrialDays] = await Promise.all([
        getProPlanPricingConfig(),
        getTrialDays(),
      ]);
      return NextResponse.json({
        success: false,
        displayPrice: fallbackPricing.displayPrice,
        rawPrice: String(fallbackPricing.amountMinor / 100),
        currency: fallbackPricing.currency,
        trialDays: fallbackTrialDays,
        label: fallbackPricing.displayLabel,
      });
    } catch {
      // Last resort hardcoded defaults
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
}
