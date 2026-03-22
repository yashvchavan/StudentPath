import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import pool from "@/lib/db";

async function ensureRazorpaySubscriptionColumns() {
  const statements = [
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255) NULL",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255) NULL",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512) NULL",
  ];

  for (const sql of statements) {
    try {
      await pool.execute(sql);
    } catch (error) {
      // Older MySQL may not support IF NOT EXISTS. In that case, continue and let
      // the verification query fail with a clear error if the column is still missing.
      console.warn("[razorpay/verify-payment] Column ensure warning:", error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify HMAC signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed – invalid signature" },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    const studentId = String(user.id);

    await ensureRazorpaySubscriptionColumns();

    // Try to UPDATE an existing subscription row first
    const [updateResult]: any = await pool.execute(
      `UPDATE subscriptions
       SET plan = 'pro',
           status = 'active',
           razorpay_order_id = ?,
           razorpay_payment_id = ?,
           razorpay_signature = ?,
           current_period_start = ?,
           current_period_end = ?,
           updated_at = NOW()
       WHERE student_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, now, periodEnd, studentId]
    );

    // If no existing row, create a fresh subscription record
    if (!updateResult || updateResult.affectedRows === 0) {
      await pool.execute(
        `INSERT INTO subscriptions
           (student_id, plan, status,
            razorpay_order_id, razorpay_payment_id, razorpay_signature,
            current_period_start, current_period_end,
            created_at, updated_at)
         VALUES (?, 'pro', 'active', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [studentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, now, periodEnd]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified. Pro plan activated for 1 year.",
      periodEndsAt: periodEnd.toISOString(),
    });
  } catch (error: any) {
    console.error("[razorpay/verify-payment] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
