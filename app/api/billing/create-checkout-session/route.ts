  import { NextRequest, NextResponse } from "next/server";
  import { getAuthUser } from "@/lib/auth";
  import { stripe } from "@/lib/stripe";

  export const dynamic = "force-dynamic";

  /**
   * POST /api/billing/create-checkout-session
   *
   * Body: { plan: "pro" }
   * Auth: student only.
   */
  export async function POST(req: NextRequest) {
    if (!stripe) {
      return NextResponse.json(
        { error: "Billing is not configured. Please contact support." },
        { status: 500 }
      );
    }

    try {
      const user = await getAuthUser();
      if (!user || user.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json().catch(() => ({}));
      const plan = (body.plan as string) || "pro";

      if (plan !== "pro") {
        return NextResponse.json(
          { error: "Only Pro plan checkout is currently supported." },
          { status: 400 }
        );
      }

      const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
      if (!priceId) {
        return NextResponse.json(
          { error: "Stripe price not configured." },
          { status: 500 }
        );
      }

      const origin = req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",

    payment_method_types: ["card"],

    billing_address_collection: "required",   // REQUIRED FOR INDIA
    // customer_creation: "",              // creates Stripe customer

    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    customer_email: user.email,

    client_reference_id: String(user.id),

    success_url: `${origin}/dashboard?billing=success`,
    cancel_url: `${origin}/dashboard/settings?billing=canceled`,

    subscription_data: {
      metadata: {
        student_id: String(user.id),
        plan: "pro",
      },
    },

    metadata: {
      student_id: String(user.id),
      plan: "pro",
      service: "StudentPath AI Career Platform",
    },
  });

      return NextResponse.json({ url: session.url });
    } catch (error: any) {
      console.error("[Billing] create-checkout-session error:", error);
      return NextResponse.json(
        { error: "Unable to start checkout.", details: error?.message },
        { status: 500 }
      );
    }
  }

