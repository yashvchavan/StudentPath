"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Clock, X, ChevronRight, Lock,
} from "lucide-react";
import { PricingModal } from "./PricingModal";

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "trial_expired"
  | "expired"
  | "free"
  | null;

interface ProUpgradeFABProps {
  status: SubscriptionStatus;
  daysLeft: number | null;
  onSuccess?: () => void;
}

export function ProUpgradeFAB({ status, daysLeft, onSuccess }: ProUpgradeFABProps) {
  const [dismissed, setDismissed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  // Don't show for active pro users or if dismissed or still loading
  if (status === "active" || status === null || dismissed) return null;

  const isExpired = status === "trial_expired" || status === "expired";
  const isTrialing = status === "trialing";

  // Trial progress percentage
  const trialProgress =
    isTrialing && daysLeft !== null
      ? Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))
      : 100;

  const handleSuccess = () => {
    setPricingOpen(false);
    setDismissed(true);
    onSuccess?.();
  };

  return (
    <>
      <div
        className={`
          fixed bottom-6 right-6 z-50
          flex flex-col gap-0 w-64
          rounded-2xl shadow-2xl border
          animate-in slide-in-from-bottom-4 fade-in duration-500
          ${isExpired
            ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/60 dark:to-orange-950/60 dark:border-amber-700"
            : "bg-card border-primary/30"
          }
        `}
      >
        {/* Top bar */}
        <div
          className={`
            flex items-center justify-between px-4 pt-3 pb-1
          `}
        >
          <div className="flex items-center gap-1.5">
            {isExpired ? (
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
            )}
            <span
              className={`text-xs font-semibold ${
                isExpired ? "text-amber-700 dark:text-amber-300" : "text-primary"
              }`}
            >
              {isExpired
                ? "Trial ended"
                : daysLeft !== null
                  ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in trial`
                  : "Free trial active"}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trial progress bar (only during trial) */}
        {isTrialing && (
          <div className="px-4 pb-2">
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${trialProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Message */}
        <div className="px-4 pb-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isExpired
              ? "Upgrade to Pro to unlock Career Tracks, AI Assistant, Resume Analyzer and more."
              : "Upgrade before your trial ends and keep all features - just ₹299/year."}
          </p>
        </div>

        {/* CTA button */}
        <div className="px-4 pb-4 pt-2">
          <Button
            size="sm"
            className={`w-full gap-1.5 font-semibold text-sm ${
              isExpired
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : ""
            }`}
            onClick={() => setPricingOpen(true)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isExpired ? "Unlock Pro Now" : "View Plans"}
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        </div>
      </div>

      <PricingModal
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
