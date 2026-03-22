"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, CreditCard, ShieldCheck, Clock, Sparkles,
  AlertCircle, CheckCircle2, Zap,
} from "lucide-react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

type PlanStatus = "trialing" | "active" | "trial_expired" | "expired" | "free" | null;

interface BillingState {
  loading: boolean;
  error: string | null;
  status: PlanStatus;
  daysLeft: number | null;
  trialEndsAt: string | null;
  periodEndsAt: string | null;
  isProActive: boolean;
}

export function StudentBillingCard() {
  const [state, setState] = useState<BillingState>({
    loading: true,
    error: null,
    status: null,
    daysLeft: null,
    trialEndsAt: null,
    periodEndsAt: null,
    isProActive: false,
  });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const res = await fetch("/api/subscription/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load subscription status.");
      const data = await res.json();
      setState({
        loading: false,
        error: null,
        status: data.status,
        daysLeft: data.daysLeft,
        trialEndsAt: data.trialEndsAt,
        periodEndsAt: data.periodEndsAt,
        isProActive: data.isProActive,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.message || "Failed to load billing state.",
      }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = () => {
    setUpgradeOpen(false);
    load();
  };

  const statusLabel: Record<Exclude<PlanStatus, null>, string> = {
    trialing: "Free Trial",
    active: "Pro – Active",
    trial_expired: "Trial Ended",
    expired: "Pro – Expired",
    free: "Free",
  };

  const statusVariant = (
    s: PlanStatus
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "active") return "default";
    if (s === "trialing") return "secondary";
    if (s === "trial_expired" || s === "expired") return "destructive";
    return "outline";
  };

  const renewalDate = state.periodEndsAt || state.trialEndsAt;
  const formattedDate = renewalDate
    ? new Date(renewalDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing & Plan
          </CardTitle>
          <CardDescription>Manage your StudentPath plan and subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading billing status…
            </div>
          ) : state.error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <span>{state.error}</span>
            </div>
          ) : (
            <>
              {/* Current plan */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold">
                      {state.status === "active" ? "Pro" : "Free"}
                    </span>
                    {state.status && (
                      <Badge variant={statusVariant(state.status)} className="text-[10px]">
                        {statusLabel[state.status]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {state.daysLeft !== null && state.isProActive && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {state.status === "trialing"
                        ? `${state.daysLeft}d trial left`
                        : `${state.daysLeft}d remaining`}
                    </div>
                  )}
                  {formattedDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {state.status === "trialing" ? "Trial ends" : state.status === "active" ? "Renews" : "Ended"}: {formattedDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Pro features list */}
              <div className="rounded-md border border-muted p-3 bg-muted/40 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="font-semibold text-foreground text-xs">Pro includes:</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Career Tracks, Internships & Placements</li>
                  <li>AI Assistant — unlimited career & syllabus chat</li>
                  <li>Resume Analyzer & multi-company ATS scoring</li>
                  <li>AI-generated personalised career plans</li>
                  <li>Progress Reports, Recommendations & Notifications</li>
                </ul>
              </div>

              {/* Pricing */}
              {!state.isProActive || state.status === "trial_expired" || state.status === "expired" ? (
                <div className="flex items-baseline gap-1 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                  <span className="text-2xl font-bold text-primary">$12</span>
                  <span className="text-sm text-muted-foreground">/ year</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    <Zap className="w-2.5 h-2.5 mr-0.5" />Best value
                  </Badge>
                </div>
              ) : null}

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {state.isProActive && state.status === "active" ? (
                  <Button variant="outline" className="flex-1 flex items-center justify-center gap-2" disabled>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Pro Plan Active
                  </Button>
                ) : (
                  <Button
                    onClick={() => setUpgradeOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {state.status === "trialing" ? "Upgrade Now (Lock in $12/yr)" : "Upgrade to Pro - $12/yr"}
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
                  College plan? Talk to sales
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
