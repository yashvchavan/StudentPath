import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  createRazorpayOrder,
  getCheckoutKeyId,
  PRO_PLAN_AMOUNT_MINOR,
  PRO_PLAN_CURRENCY,
  PRO_PLAN_DISPLAY_PRICE,
  PRO_PLAN_DISPLAY_LABEL,
} from "@/lib/razorpay";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await createRazorpayOrder(user.id);
    const checkoutKeyId = getCheckoutKeyId();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: PRO_PLAN_AMOUNT_MINOR,
      currency: PRO_PLAN_CURRENCY,
      displayPrice: PRO_PLAN_DISPLAY_PRICE,
      displayLabel: PRO_PLAN_DISPLAY_LABEL,
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
