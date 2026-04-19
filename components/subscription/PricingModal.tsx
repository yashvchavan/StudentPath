"use client";

import { useState, useEffect } from "react";
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
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  PartyPopper,
} from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import { usePricing } from "@/hooks/use-pricing";

interface PlanFeature {
  label: string;
  free: boolean;
  pro: boolean;
}

const PLAN_FEATURES: PlanFeature[] = [
  { label: "Dashboard & Overview",         free: true,  pro: true  },
  { label: "My Courses",                   free: true,  pro: true  },
  { label: "Career Goals Tracker",         free: true,  pro: true  },
  { label: "Skills Tracker",               free: true,  pro: true  },
  { label: "Profile & Settings",           free: true,  pro: true  },
  { label: "Career Tracks & Road Maps",    free: false, pro: true  },
  { label: "Internship Applications",      free: false, pro: true  },
  { label: "Placement Prep & Reviews",     free: false, pro: true  },
  { label: "AI Assistant (unlimited)",     free: false, pro: true  },
  { label: "Resume Analyzer & ATS Score",  free: false, pro: true  },
  { label: "AI Recommendations",           free: false, pro: true  },
  { label: "Progress Reports & Analytics", free: false, pro: true  },
  { label: "Smart Notifications",          free: false, pro: true  },
];

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PricingModal({ open, onOpenChange, onSuccess }: PricingModalProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { pricing } = usePricing();

  // Track trial status to show appropriate UI
  const [trialStatus, setTrialStatus] = useState<{
    isTrialing: boolean;
    daysLeft: number | null;
    loaded: boolean;
  }>({ isTrialing: false, daysLeft: null, loaded: false });

  // Fetch subscription status when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/subscription/status", { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setTrialStatus({
            isTrialing: data.status === "trialing",
            daysLeft: data.daysLeft,
            loaded: true,
          });
        }
      } catch {
        if (!cancelled) setTrialStatus((t) => ({ ...t, loaded: true }));
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [open]);

  const handleUpgradeSuccess = () => {
    setUpgradeOpen(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              Choose Your Plan
            </DialogTitle>
            <DialogDescription>
              Start with Free or unlock everything with Pro
            </DialogDescription>
          </DialogHeader>

          {/* Trial active info banner */}
          {trialStatus.loaded && trialStatus.isTrialing && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 -mt-1">
              <PartyPopper className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Free trial active — {trialStatus.daysLeft !== null ? `${trialStatus.daysLeft} day${trialStatus.daysLeft !== 1 ? "s" : ""} left` : "All Pro features unlocked"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  You can upgrade after your trial ends.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* ─── Free Plan ──────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-muted/30 p-5 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base">Free</span>
                  <Badge variant="outline" className="text-[10px]">Current (after trial)</Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">$0</span>
                  <span className="text-xs text-muted-foreground">/ forever</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Basic access to track your learning journey
                </p>
              </div>

              <ul className="space-y-2 flex-1">
                {PLAN_FEATURES.map(({ label, free }) => (
                  <li key={label} className="flex items-start gap-2 text-sm">
                    {free ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={free ? "" : "text-muted-foreground/50 line-through"}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" disabled className="w-full text-xs">
                Your plan after trial
              </Button>
            </div>

            {/* ─── Pro Plan ───────────────────────────────────────────── */}
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 flex flex-col gap-4 relative overflow-hidden">
              {/* Most popular ribbon */}
              <div className="absolute top-3 right-3">
                <Badge className="text-[10px] gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Most Popular
                </Badge>
              </div>

              {/* Trial current badge */}
              {trialStatus.loaded && trialStatus.isTrialing && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    <Clock className="w-2.5 h-2.5" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <div className={trialStatus.isTrialing ? "mt-5" : ""}>
                <span className="font-semibold text-base">Pro</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{pricing.displayPrice}</span>
                  <span className="text-xs text-muted-foreground">/ year</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Full access to every feature for 12 months
                </p>
              </div>

              <ul className="space-y-2 flex-1">
                {PLAN_FEATURES.map(({ label, pro }) => (
                  <li key={label} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        pro ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              {trialStatus.loaded && trialStatus.isTrialing ? (
                /* Trial active: show info instead of upgrade button */
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      You have full Pro access during your trial
                    </span>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground -mt-2">
                    Upgrade available after trial ends · {pricing.displayPrice}/year
                  </p>
                </>
              ) : (
                /* Post-trial: show upgrade button */
                <>
                  <Button
                    className="w-full gap-2"
                    onClick={() => setUpgradeOpen(true)}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Get Pro - {pricing.displayPrice} / year
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground -mt-2">
                    Secure payment via Razorpay · Renews after 1 year
                  </p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Razorpay checkout sheet (opened from "Get Pro" button above) */}
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onSuccess={handleUpgradeSuccess}
      />
    </>
  );
}
