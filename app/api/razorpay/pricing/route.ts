/**
 * GET /api/razorpay/pricing
 * Public-ish endpoint (requires authenticated student session) that returns
 * the current pro plan pricing info from platform_config so the UI can
 * display it dynamically instead of using a hardcoded value.
 */

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getTrialDays } from "@/lib/subscriptions";

async function getConfigValue(key: string, defaultValue: string): Promise<string> {
  try {
    const [rows]: any = await pool.execute(
      `SELECT config_value FROM platform_config WHERE config_key = ? AND scope = 'global' LIMIT 1`,
      [key]
    );
    if (rows && rows.length > 0 && rows[0].config_value) {
      return String(rows[0].config_value).trim();
    }
  } catch {
    // platform_config table may not exist yet — fall through to default
  }
  return defaultValue;
}

export async function GET() {
  try {
    const [displayPrice, currency, trialDays] = await Promise.all([
      getConfigValue("pro_plan_display_price", "3.21"),
      getConfigValue("pro_plan_currency", "USD"),
      getTrialDays(),
    ]);

    // Format the display label
    const currencySymbol = currency === "INR" ? "₹" : "$";
    const formattedPrice = `${currencySymbol}${displayPrice}`;

    return NextResponse.json({
      success: true,
      displayPrice: formattedPrice,
      rawPrice: displayPrice,
      currency,
      trialDays,
      label: "per year",
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
