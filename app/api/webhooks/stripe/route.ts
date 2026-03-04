import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function upsertSubscriptionFromStripe(payload: any) {
  const subscription = payload;

  const studentId: string | undefined =
    (subscription.metadata && subscription.metadata.student_id) ||
    (subscription.metadata && subscription.metadata.user_id);

  if (!studentId) {
    console.warn("[Stripe Webhook] Missing student_id metadata on subscription");
    return;
  }

  const plan: string =
    (subscription.metadata && subscription.metadata.plan) || "pro";

  const status: string = subscription.status || "inactive";
  const stripeCustomerId: string | null =
    (subscription.customer as string) || null;
  const stripeSubscriptionId: string = subscription.id;
  const stripePriceId: string | null =
    subscription.items?.data?.[0]?.price?.id || null;

  const currentPeriodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : null;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  await pool.execute(
    `INSERT INTO subscriptions (
        student_id,
        plan,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        current_period_start,
        current_period_end
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        plan = VALUES(plan),
        status = VALUES(status),
        stripe_customer_id = VALUES(stripe_customer_id),
        stripe_price_id = VALUES(stripe_price_id),
        current_period_start = VALUES(current_period_start),
        current_period_end = VALUES(current_period_end),
        updated_at = CURRENT_TIMESTAMP`,
    [
      studentId,
      plan,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodStart,
      currentPeriodEnd,
    ]
  );
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.warn(
      "[Stripe Webhook] Missing Stripe configuration. Ignoring webhook."
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;
        const subscriptionId = session.subscription as string | undefined;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          await upsertSubscriptionFromStripe(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;
        await upsertSubscriptionFromStripe(subscription);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler error", details: err?.message },
      { status: 500 }
    );
  }
}

