"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  Bot,
  FileText,
  Compass,
  Briefcase,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  Bell,
  ShieldCheck,
  Zap,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after payment is successfully verified */
  onSuccess?: () => void;
  /** Which locked feature the user tried to open (for messaging) */
  featureLabel?: string;
}

const PRO_FEATURES = [
  { icon: Compass,       label: "Career Tracks & Planning" },
  { icon: Briefcase,     label: "Internship Applications" },
  { icon: GraduationCap, label: "Placement Prep & Reviews" },
  { icon: Lightbulb,     label: "AI Recommendations" },
  { icon: TrendingUp,    label: "Progress Reports & Analytics" },
  { icon: Bot,           label: "AI Assistant (Unlimited Chat)" },
  { icon: FileText,      label: "Resume Analyzer & ATS Scoring" },
  { icon: Bell,          label: "Smart Notifications" },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function UpgradeModal({
  open,
  onOpenChange,
  onSuccess,
  featureLabel,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

      // 2. Create order on the server
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        credentials: "include",
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order.");
      }

      // 3. Fetch user name / email for prefill
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const meData = await meRes.json();
      const prefill = meData?.user
        ? { name: meData.user.name, email: meData.user.email }
        : {};

      // 4. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "StudentPath",
          description: "Pro Plan – 1 Year",
          image: "/logo.png",
          order_id: orderData.orderId,
          prefill,
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: () => {
              setLoading(false);
              resolve();
            },
          },
          handler: async (response: any) => {
            // 5. Verify payment on server
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }
              setSuccess(true);
              onSuccess?.();
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
        });

        rzp.on("payment.failed", async (failure: any) => {
          const err = failure?.error || {};
          const detailParts = [
            err?.description,
            err?.reason,
            err?.code ? `code: ${err.code}` : null,
            err?.source ? `source: ${err.source}` : null,
            err?.step ? `step: ${err.step}` : null,
          ].filter(Boolean);

          // Keep full payload in console for faster support/debugging.
          console.error("[Razorpay payment.failed]", failure);

          try {
            await fetch("/api/razorpay/log-failure", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                failure,
                checkout: {
                  orderId: orderData?.orderId,
                  amount: orderData?.amount,
                  currency: orderData?.currency,
                },
              }),
            });
          } catch (logErr) {
            console.error("[Razorpay payment.failed] Failed to log on server", logErr);
          }

          const reason =
            detailParts.join(" | ") ||
            "Payment failed at gateway.";

          reject(new Error(reason));
        });

        rzp.open();
      });
    } catch (err: any) {
      setError(err?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  // Reset state when modal closes
  const handleOpenChange = (v: boolean) => {
    if (!v) { setError(null); setSuccess(false); setLoading(false); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            {featureLabel
              ? `"${featureLabel}" is a Pro feature.`
              : "Unlock all features with a Pro plan."}
            {" "}Upgrade to continue.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold text-lg">You're on Pro!</p>
            <p className="text-sm text-muted-foreground">
              All features are now unlocked for 1 year. Enjoy StudentPath Pro!
            </p>
            <Button onClick={() => handleOpenChange(false)} className="mt-2">
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pricing badge */}
            <div className="flex items-baseline justify-center gap-1 py-3 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-3xl font-bold text-primary">$3.21</span>
              <span className="text-sm text-muted-foreground">/ year</span>
              <Badge variant="secondary" className="ml-2 text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                Best value
              </Badge>
            </div>

            {/* Feature list */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                What you unlock
              </p>
              <ul className="space-y-1.5">
                {PRO_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                {error}
              </p>
            )}

            {/* CTA */}
            <Button
              className="w-full gap-2"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Pay $3.21 - Unlock Pro for 1 Year
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Secure payment via Razorpay · Auto-renew after 1 year
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
