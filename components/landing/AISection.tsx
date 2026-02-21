"use client";

import { motion, type Variants } from "framer-motion";
import { CheckCircle2, Cpu, Zap } from "lucide-react";

const BG = "#030309";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};
const fadeLeft: Variants = {
    hidden: { opacity: 0, x: -48 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const fadeRight: Variants = {
    hidden: { opacity: 0, x: 48 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

// ── Separator line component ─────────────────────────────────────
function Separator({ color = "rgba(99,102,241,0.25)" }: { color?: string }) {
    return (
        <div className="max-w-7xl mx-auto px-6">
            <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        </div>
    );
}

export function AISection() {
    const capabilities = [
        "Personalized career path generation",
        "Real-time skill gap analysis",
        "Smart mentor matching algorithm",
        "Industry trend forecasting",
        "Résumé & profile optimization",
        "Adaptive content recommendations",
    ];

    return (
        <>
            {/* ── Top separator ── */}
            <Separator color="rgba(99,102,241,0.3)" />

            <section
                id="ai-section"
                className="relative py-32 px-6 overflow-hidden"
                style={{ background: BG }}
            >
                {/* Subtle center glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse 55% 45% at 65% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)",
                    }}
                />

                <div className="max-w-7xl mx-auto">
                    {/* Section label row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="flex items-center gap-4 mb-16"
                    >
                        <div className="h-[2px] w-6 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-indigo-400">
                            AI Core Technology
                        </span>
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.2), transparent)" }} />
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                    >
                        {/* Left */}
                        <motion.div variants={fadeLeft}>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
                                Powered by{" "}
                                <span
                                    style={{
                                        color: "#818cf8",
                                    }}
                                >
                                    next-gen AI
                                </span>
                            </h2>

                            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-md">
                                Our engine doesn't just recommend — it understands context. Built on advanced models, it adapts uniquely to each student's profile, ambitions, and learning pace.
                            </p>

                            {/* Capabilities with inline separator ticks */}
                            <motion.ul variants={stagger} className="space-y-0">
                                {capabilities.map((cap, i) => (
                                    <motion.li
                                        key={i}
                                        variants={fadeUp}
                                        className="flex items-center gap-3 py-3 text-sm"
                                        style={{
                                            color: "rgba(209,213,219,0.85)",
                                            borderBottom: i < capabilities.length - 1
                                                ? "1px solid rgba(255,255,255,0.04)"
                                                : "none",
                                        }}
                                    >
                                        <CheckCircle2
                                            className="w-4 h-4 flex-shrink-0"
                                            style={{ color: "#6366f1" }}
                                        />
                                        {cap}
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>

                        {/* Right: AI cards */}
                        <motion.div variants={fadeRight} className="space-y-4">
                            {/* Chat card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                                whileHover={{ y: -4 }}
                                className="rounded-2xl p-5"
                                style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    backdropFilter: "blur(20px)",
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)" }}
                                    >
                                        <Cpu className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white font-semibold text-sm tracking-tight">AI Assistant</span>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                        <span className="text-indigo-400 text-xs font-bold tracking-wide">Live</span>
                                    </div>
                                </div>
                                {/* Separator inside card */}
                                <div className="h-px mb-4" style={{ background: "rgba(255,255,255,0.05)" }} />
                                <div
                                    className="rounded-xl px-4 py-3 mb-3 text-sm"
                                    style={{
                                        background: "rgba(99,102,241,0.07)",
                                        border: "1px solid rgba(99,102,241,0.14)",
                                        color: "rgba(209,213,219,0.9)",
                                    }}
                                >
                                    Based on your profile, I recommend exploring{" "}
                                    <span className="text-indigo-400 font-semibold">Full-Stack Development</span>.{" "}
                                    Your React skills are a great foundation.
                                </div>
                                <div className="flex gap-2">
                                    {["View Path →", "Explore More", "Skip"].map((t) => (
                                        <button
                                            key={t}
                                            className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-white transition-colors duration-200"
                                            style={{
                                                background: "rgba(255,255,255,0.04)",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                            }}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Skill bars */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                                whileHover={{ y: -4 }}
                                className="rounded-2xl p-5"
                                style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                }}
                            >
                                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-600 mb-1">
                                    Skill Gap Analysis
                                </div>
                                {/* Separator */}
                                <div className="h-px mt-3 mb-4" style={{ background: "rgba(255,255,255,0.04)" }} />
                                {[
                                    { skill: "React / Next.js", pct: 78, color: "#2563eb" },
                                    { skill: "System Design", pct: 42, color: "#7c3aed" },
                                    { skill: "Cloud (AWS)", pct: 30, color: "#2563eb" },
                                ].map((s, idx, arr) => (
                                    <div
                                        key={s.skill}
                                        className="py-3"
                                        style={{
                                            borderBottom: idx < arr.length - 1
                                                ? "1px solid rgba(255,255,255,0.04)"
                                                : "none",
                                        }}
                                    >
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-gray-400">{s.skill}</span>
                                            <span className="text-gray-300 font-semibold">{s.pct}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${s.pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.3, ease: "easeOut", delay: 0.4 + idx * 0.1 }}
                                                className="h-full rounded-full"
                                                style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}70)` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Match card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                                whileHover={{ y: -4 }}
                                className="rounded-2xl p-4 flex items-center gap-4"
                                style={{
                                    background: "rgba(79,70,229,0.05)",
                                    border: "1px solid rgba(79,70,229,0.12)",
                                }}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)" }}
                                >
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-semibold text-sm tracking-tight">Career Match Found</div>
                                    <div className="text-gray-600 text-xs mt-0.5">Software Engineer @ Google — 94% compatibility</div>
                                </div>
                                <div
                                    className="text-indigo-400 font-black text-xl pl-4"
                                    style={{ borderLeft: "1px solid rgba(79,70,229,0.15)" }}
                                >
                                    94%
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Bottom separator ── */}
            <Separator color="rgba(79,70,229,0.2)" />
        </>
    );
}
