import crypto from "crypto";

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export function getCheckoutKeyId(): string {
  if (!RAZORPAY_KEY_ID) {
    throw new Error("RAZORPAY_KEY_ID is not configured");
  }

  // Keep NEXT_PUBLIC_RAZORPAY_KEY_ID optional, but warn if it drifts from server key.
  // Checkout must use the same account key as order creation.
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (publicKey && publicKey !== RAZORPAY_KEY_ID) {
    console.warn(
      "[Razorpay] NEXT_PUBLIC_RAZORPAY_KEY_ID differs from RAZORPAY_KEY_ID. Using RAZORPAY_KEY_ID for checkout to avoid key/order mismatch."
    );
  }

  return RAZORPAY_KEY_ID;
}

// $12 / year  -> 1200 cents (Razorpay expects smallest currency unit)
export const PRO_PLAN_AMOUNT_MINOR = Number(
  process.env.RAZORPAY_PRO_PLAN_AMOUNT_MINOR ||
    process.env.RAZORPAY_PRO_PLAN_AMOUNT ||
    1200
);
export const PRO_PLAN_CURRENCY = (
  process.env.RAZORPAY_PRO_PLAN_CURRENCY || "USD"
).toUpperCase();
export const PRO_PLAN_DISPLAY_PRICE = "$12";
export const PRO_PLAN_DISPLAY_LABEL = "per year";
export const PRO_PLAN_DURATION_MONTHS = 12;

// ─── Order creation ────────────────────────────────────────────────────────
export async function createRazorpayOrder(studentId: string | number) {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured on server");
  }

  if (!Number.isInteger(PRO_PLAN_AMOUNT_MINOR) || PRO_PLAN_AMOUNT_MINOR <= 0) {
    throw new Error(
      "Invalid plan amount. Set RAZORPAY_PRO_PLAN_AMOUNT_MINOR as a positive integer (smallest currency unit)."
    );
  }

  const receipt = `sp_pro_${studentId}_${Date.now()}`;

  const credentials = Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: PRO_PLAN_AMOUNT_MINOR,
      currency: PRO_PLAN_CURRENCY,
      receipt,
      notes: { plan: "pro", duration: "1_year", student_id: String(studentId) },
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let err: any = null;

    try {
      err = JSON.parse(raw);
    } catch {
      err = null;
    }

    const code = err?.error?.code;
    const description =
      err?.error?.description ||
      err?.error?.reason ||
      `Failed to create Razorpay order (HTTP ${response.status})`;

    const lower = String(description).toLowerCase();
    const currencyHint =
      PRO_PLAN_CURRENCY === "USD" &&
      (lower.includes("currency") || lower.includes("international"))
        ? " Enable international/USD in Razorpay dashboard or use a supported currency via RAZORPAY_PRO_PLAN_CURRENCY."
        : "";

    throw new Error(
      `${code ? `[${code}] ` : ""}${description}${currencyHint}`
    );
  }

  return response.json() as Promise<{ id: string; amount: number; currency: string }>;
}

// ─── Signature verification ────────────────────────────────────────────────
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === razorpaySignature;
}
