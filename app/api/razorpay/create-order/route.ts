import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  createRazorpayOrder,
  getCheckoutKeyId,
  getProPlanPricingConfig,
  PRO_PLAN_CURRENCY,
  PRO_PLAN_AMOUNT_MINOR,
} from "@/lib/razorpay";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pricing = await getProPlanPricingConfig();
    const order = await createRazorpayOrder(user.id, {
      amountMinor: pricing.amountMinor,
      currency: pricing.currency,
    });
    const checkoutKeyId = getCheckoutKeyId();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: pricing.amountMinor,
      currency: pricing.currency,
      displayPrice: pricing.displayPrice,
      displayLabel: pricing.displayLabel,
      keyId: checkoutKeyId,
      mode: checkoutKeyId.startsWith("rzp_test_") ? "test" : "live",
    });
  } catch (error: any) {
    console.error("[razorpay/create-order] Error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to create payment order",
        currency: PRO_PLAN_CURRENCY,
        amount: PRO_PLAN_AMOUNT_MINOR,
      },
      { status: 500 }
    );
  }
}
