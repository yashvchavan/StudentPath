"use client";

import { motion, type Variants } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useState } from "react";

const BG = "#030309";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

type PlanId = "free" | "pro" | "college";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceSub: string;
  badge?: string;
  highlight?: boolean;
  description: string;
  cta: string;
  href: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    priceSub: "Forever",
    description: "Ideal for students exploring their first AI-powered roadmap.",
    cta: "Start for Free",
    href: "/register-other",
    features: [
      "AI career assistant with basic limits",
      "Résumé upload & single ATS check",
      "1 active career track",
      "Skill gap overview dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    priceSub: "per month • ₹399/mo billed yearly",
    badge: "Most Popular",
    highlight: true,
    description: "For ambitious students who want deeper insights and higher limits.",
    cta: "Upgrade to Pro",
    href: "/dashboard/settings",
    features: [
      "Higher AI chat limits in the Assistant dashboard",
      "Advanced ATS résumé analyzer with history & comparisons",
      "Unlimited AI-generated career tracks & gamified plans",
      "Priority access to new AI features and experiments",
    ],
  },
  {
    id: "college",
    name: "College-sponsored Pro",
    price: "Custom",
    priceSub: "per institution",
    badge: "Best for Colleges",
    description: "Campus-wide intelligence, analytics, and unlimited student access.",
    cta: "Talk to Sales",
    href: "mailto:vijishvanya@gmail.com",
    features: [
      "Unlimited student seats with Pro features",
      "Placement analytics & cohort dashboards",
      "Per-college tokens and usage controls",
      "Dedicated onboarding & success support",
    ],
  },
];

export function PricingSection() {
  const [activePlan, setActivePlan] = useState<PlanId>("pro");

  return (
    <section
      id="pricing-section"
      className="relative py-32 px-6"
      style={{ background: BG }}
    >
      {/* Divider line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(79,70,229,0.35), transparent)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(79,70,229,0.25), transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-14 text-center"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full mb-4"
            style={{
              background: "rgba(79,70,229,0.08)",
              border: "1px solid rgba(79,70,229,0.22)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-indigo-300">
              Simple Pricing
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-black text-white leading-tight mb-4"
          >
            Flexible plans for{" "}
            <span style={{ color: "#818cf8" }}>every learner</span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
          >
            Start free, then scale up to Pro or campus-wide access as you grow.
            Limits adapt automatically based on your plan.
          </motion.p>
        </motion.div>

        {/* Plans */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {PLANS.map((plan) => {
            const isActive = activePlan === plan.id || plan.highlight;

            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                onMouseEnter={() => setActivePlan(plan.id)}
                className={`relative rounded-2xl p-6 flex flex-col h-full ${
                  plan.highlight ? "md:scale-[1.02]" : ""
                }`}
                style={{
                  background: plan.highlight
                    ? "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.18))"
                    : "rgba(255,255,255,0.02)",
                  border: plan.highlight
                    ? "1px solid rgba(129,140,248,0.7)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: plan.highlight
                    ? "0 18px 60px rgba(37,99,235,0.45)"
                    : "0 10px 40px rgba(0,0,0,0.45)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/40">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-[0.16em]">
                      {plan.priceSub}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 text-sm flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <Check
                        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        style={{ color: "#4ade80" }}
                      />
                      <span className="text-xs md:text-sm text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg,#2563eb,#7c3aed,#000000)"
                      : "rgba(255,255,255,0.04)",
                    border: isActive
                      ? "1px solid rgba(191,219,254,0.5)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: isActive ? "#ffffff" : "rgba(209,213,219,0.9)",
                  }}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Hint about limits */}
        <p className="mt-6 text-center text-[11px] text-gray-600">
          AI chat, résumé analysis, and career track generation limits are
          enforced per day based on your current plan. Campus plans can be
          customized for 10k+ students per college.
        </p>
      </div>
    </section>
  );
}

