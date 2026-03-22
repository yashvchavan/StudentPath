import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

async function fetchRazorpayPaymentDetails(paymentId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || !paymentId) {
    return null;
  }

  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        fetchError: true,
        status: res.status,
        body: errBody,
      };
    }

    const payment = await res.json();
    return {
      id: payment?.id || null,
      status: payment?.status || null,
      method: payment?.method || null,
      amount: payment?.amount ?? null,
      currency: payment?.currency || null,
      order_id: payment?.order_id || null,
      error_code: payment?.error_code || null,
      error_description: payment?.error_description || null,
      error_source: payment?.error_source || null,
      error_step: payment?.error_step || null,
      error_reason: payment?.error_reason || null,
      contact: payment?.contact || null,
      email: payment?.email || null,
      created_at: payment?.created_at || null,
    };
  } catch (error: any) {
    return {
      fetchError: true,
      message: error?.message || "Failed to fetch payment details",
    };
  }
}

async function fetchRazorpayOrderDetails(orderId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || !orderId) {
    return null;
  }

  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        fetchError: true,
        status: res.status,
        body: errBody,
      };
    }

    const order = await res.json();
    return {
      id: order?.id || null,
      status: order?.status || null,
      amount: order?.amount ?? null,
      amount_due: order?.amount_due ?? null,
      amount_paid: order?.amount_paid ?? null,
      currency: order?.currency || null,
      attempts: order?.attempts ?? null,
      notes: order?.notes || null,
      created_at: order?.created_at || null,
    };
  } catch (error: any) {
    return {
      fetchError: true,
      message: error?.message || "Failed to fetch order details",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const error = body?.failure?.error || {};
    const orderId = body?.checkout?.orderId || error?.metadata?.order_id || null;
    const paymentId =
      error?.metadata?.payment_id || body?.failure?.error?.metadata?.payment_id || null;
    const razorpayPaymentDetails = paymentId
      ? await fetchRazorpayPaymentDetails(String(paymentId))
      : null;
    const razorpayOrderDetails = orderId
      ? await fetchRazorpayOrderDetails(String(orderId))
      : null;
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const integrationMode = keyId.startsWith("rzp_test_")
      ? "test"
      : keyId.startsWith("rzp_live_")
      ? "live"
      : "unknown";
    const keyFingerprint = keyId ? `${keyId.slice(0, 8)}...${keyId.slice(-4)}` : null;

    console.error("[razorpay/log-failure] Checkout payment.failed", {
      studentId: user.id,
      orderId: orderId || null,
      amount: body?.checkout?.amount || null,
      currency: body?.checkout?.currency || null,
      code: error?.code || null,
      description: error?.description || null,
      reason: error?.reason || null,
      source: error?.source || null,
      step: error?.step || null,
      metadata: error?.metadata || null,
      raw: body?.failure || null,
      integrationMode,
      keyFingerprint,
      razorpayOrderDetails,
      razorpayPaymentDetails,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[razorpay/log-failure] Error:", error);
    return NextResponse.json({ error: "Failed to log checkout failure" }, { status: 500 });
  }
}
