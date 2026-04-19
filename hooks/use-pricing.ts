"use client";

import { useEffect, useState } from "react";

interface PricingInfo {
  displayPrice: string;   // e.g. "$3.21" or "₹299"
  rawPrice: string;       // e.g. "3.21"
  currency: string;       // e.g. "USD" or "INR"
  trialDays: number;      // e.g. 30 or 50
  label: string;          // e.g. "per year"
}

const DEFAULT_PRICING: PricingInfo = {
  displayPrice: "$3.21",
  rawPrice: "3.21",
  currency: "USD",
  trialDays: 30,
  label: "per year",
};

let cachedPricing: PricingInfo | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute – keeps pricing fresh after admin changes

export function usePricing() {
  const [pricing, setPricing] = useState<PricingInfo>(
    cachedPricing ?? DEFAULT_PRICING
  );
  const [loading, setLoading] = useState(!cachedPricing);

  useEffect(() => {
    const now = Date.now();
    if (cachedPricing && now - cacheTime < CACHE_TTL_MS) {
      setPricing(cachedPricing);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPricing() {
      try {
        const res = await fetch("/api/razorpay/pricing", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch pricing");
        const data = await res.json();

        const info: PricingInfo = {
          displayPrice: data.displayPrice ?? DEFAULT_PRICING.displayPrice,
          rawPrice: data.rawPrice ?? DEFAULT_PRICING.rawPrice,
          currency: data.currency ?? DEFAULT_PRICING.currency,
          trialDays: typeof data.trialDays === "number" ? data.trialDays : DEFAULT_PRICING.trialDays,
          label: data.label ?? DEFAULT_PRICING.label,
        };

        cachedPricing = info;
        cacheTime = Date.now();

        if (!cancelled) setPricing(info);
      } catch {
        // keep defaults on error
        if (!cancelled) setPricing(DEFAULT_PRICING);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchPricing();
    return () => { cancelled = true; };
  }, []);

  return { pricing, loading };
}
