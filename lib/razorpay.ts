import crypto from "crypto";
import pool from "@/lib/db";

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

// $3.21 / year -> 321 cents (Razorpay US account; expects smallest currency unit i.e. cents)
export const PRO_PLAN_AMOUNT_MINOR = Number(
  process.env.RAZORPAY_PRO_PLAN_AMOUNT_MINOR ||
    process.env.RAZORPAY_PRO_PLAN_AMOUNT ||
    321
);
export const PRO_PLAN_CURRENCY = (
  process.env.RAZORPAY_PRO_PLAN_CURRENCY || "USD"
).toUpperCase();
export const PRO_PLAN_DISPLAY_PRICE = "$3.21";
export const PRO_PLAN_DISPLAY_LABEL = "per year";
export const PRO_PLAN_DURATION_MONTHS = 12;

export interface ProPlanPricingConfig {
  amountMinor: number;
  currency: string;
  displayPrice: string;
  displayLabel: string;
}

function symbolForCurrency(currency: string): string {
  if (currency === "INR") return "₹";
  if (currency === "USD") return "$";
  return `${currency} `;
}

async function getLatestGlobalConfigValue(key: string): Promise<string | null> {
  try {
    const [rows]: any = await pool.execute(
      `SELECT config_value FROM platform_config
       WHERE config_key = ? AND scope = 'global' AND college_id IS NULL
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [key]
    );
    if (rows && rows.length > 0 && rows[0].config_value != null) {
      return String(rows[0].config_value).trim();
    }
  } catch {
    // platform_config may not exist yet; fall back to env/default constants.
  }
  return null;
}

export async function getProPlanPricingConfig(): Promise<ProPlanPricingConfig> {
  const [amountRaw, currencyRaw, displayRaw] = await Promise.all([
    getLatestGlobalConfigValue("pro_plan_amount_minor"),
    getLatestGlobalConfigValue("pro_plan_currency"),
    getLatestGlobalConfigValue("pro_plan_display_price"),
  ]);

  const amountParsed = Number.parseInt(amountRaw ?? "", 10);
  const amountMinor = Number.isInteger(amountParsed) && amountParsed > 0
    ? amountParsed
    : PRO_PLAN_AMOUNT_MINOR;

  const currency = (currencyRaw || PRO_PLAN_CURRENCY).toUpperCase();
  const displayBase = (displayRaw && displayRaw.length > 0)
    ? displayRaw
    : String(amountMinor / 100);
  const hasLeadingSymbol = /^[^\d\s]/.test(displayBase);

  return {
    amountMinor,
    currency,
    displayPrice: hasLeadingSymbol ? displayBase : `${symbolForCurrency(currency)}${displayBase}`,
    displayLabel: PRO_PLAN_DISPLAY_LABEL,
  };
}

// ─── Order creation ────────────────────────────────────────────────────────
export async function createRazorpayOrder(
  studentId: string | number,
  options?: { amountMinor?: number; currency?: string }
) {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured on server");
  }

  const amountMinor = options?.amountMinor ?? PRO_PLAN_AMOUNT_MINOR;
  const currency = (options?.currency ?? PRO_PLAN_CURRENCY).toUpperCase();

  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
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
      amount: amountMinor,
      currency,
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
      currency === "USD" &&
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
