"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ShieldCheck, Clock, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

type PlanName = "free" | "pro" | "college_pro";

interface BillingState {
  loading: boolean;
  error: string | null;
  plan: PlanName;
  status: string | null;
  renewsAt: string | null;
}

export function StudentBillingCard() {
  const [state, setState] = useState<BillingState>({
    loading: true,
    error: null,
    plan: "free",
    status: null,
    renewsAt: null,
  });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          throw new Error("Unable to load user session.");
        }
        const data = await res.json();
        if (!data.authenticated || !data.user || data.user.role !== "student") {
          setState((s) => ({ ...s, loading: false, error: "Please log in as a student to manage billing." }));
          return;
        }

        // For now, infer plan from subscriptions table via a small helper endpoint later.
        // As a lightweight MVP, we keep plan in "free" unless the backend overrides it.
        // You can extend this to a dedicated /api/billing/me route.
        setState((s) => ({
          ...s,
          loading: false,
          plan: "free",
          status: "inactive",
          renewsAt: null,
        }));
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err?.message || "Failed to load billing state.",
        }));
      }
    }
    load();
  }, []);

  const handleUpgrade = async () => {
    try {
      setRedirecting(true);
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to start checkout.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setState((s) => ({ ...s, error: err?.message || "Checkout failed." }));
      setRedirecting(false);
    }
  };

  const isFree = state.plan === "free";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing & Plan
        </CardTitle>
        <CardDescription>Manage your StudentPath plan and AI limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading billing status...
          </div>
        ) : state.error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
            <span>{state.error}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold capitalize">
                    {state.plan === "college_pro" ? "College-sponsored Pro" : state.plan}
                  </span>
                  {isFree ? (
                    <Badge variant="outline" className="text-[10px]">
                      Free forever
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      {state.status || "active"}
                    </Badge>
                  )}
                </div>
              </div>
              {state.renewsAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Renews {state.renewsAt}
                </div>
              )}
            </div>

            <div className="rounded-md border border-muted p-3 bg-muted/40 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-semibold text-foreground text-xs">Pro unlocks:</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>Higher AI chat limits in the Assistant tab (syllabus + career guidance)</li>
                <li>More frequent résumé analyses and company comparisons in Resume Analyzer</li>
                <li>Unlimited AI-generated career plans in Career Tracks</li>
                <li>Faster access to new AI features and improvements</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {isFree ? (
                <Button
                  onClick={handleUpgrade}
                  disabled={redirecting}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 flex items-center justify-center gap-2" disabled>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  You are on Pro
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => {
                  window.location.href = "mailto:vijishvanya@gmail.com?subject=College-sponsored Pro Plan";
                }}
              >
                Talk to sales for college plans
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

