"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Compass, Target, TrendingUp, BookOpen, Users, Sparkles,
    SlidersHorizontal, PieChart, CheckCircle, Key, FileText, Plug,
    LayoutDashboard, UserPlus, Lightbulb, Briefcase
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────
interface CardData {
    number: string;
    title: string;
    desc: string;
    accent: string[];
    icon: React.ElementType;
}

// ─── Feature Icon (replaces GradientOrb) ────────────────────────
function FeatureIcon({ icon: Icon, colors }: { icon: React.ElementType; colors: string[] }) {
    return (
        <div
            className="relative flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{
                background: `linear-gradient(135deg, ${colors[0]}15, ${colors[1]}15)`,
                border: `1px solid ${colors[0]}30`,
            }}
        >
            <div className="absolute inset-0 rounded-xl" />
            <Icon className="w-5 h-5 relative z-10" style={{ color: colors[0] }} />
        </div>
    );
}

// ─── Feature card ───────────────────────────────────────────────
function FeatureCard({
    card,
    index,
}: {
    card: CardData;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            className="group relative rounded-2xl p-6 overflow-hidden cursor-default"
            style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
            }}
        >
            {/* Hover glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at 20% 20%, ${card.accent[0]}18 0%, transparent 65%)`,
                }}
            />
            {/* Bottom line glow */}
            <div
                className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${card.accent[0]}, transparent)` }}
            />

            <div className="flex items-start gap-4">
                <FeatureIcon icon={card.icon} colors={card.accent} />
                <div className="min-w-0">
                    <div
                        className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2"
                        style={{ color: card.accent[0] }}
                    >
                        {card.number}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 leading-snug">{card.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Section wrapper ────────────────────────────────────────────
interface SectionProps {
    id: string;
    tag: string;
    tagColor: string;
    title: React.ReactNode;
    subtitle: string;
    cards: CardData[];
    mockup: React.ReactNode;
    flip?: boolean; // flip mockup side
    bg: string;
}

function Section({ id, tag, tagColor, title, subtitle, cards, mockup, flip = false, bg }: SectionProps) {
    return (
        <section
            id={id}
            className="relative py-28 px-6 overflow-hidden"
            style={{ background: bg }}
        >
            {/* Top divider line */}
            <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${tagColor}30, transparent)` }}
            />
            {/* Ambient glow */}
            <div
                className="absolute top-0 pointer-events-none w-[600px] h-[600px] rounded-full blur-3xl"
                style={{
                    background: `radial-gradient(circle, ${tagColor}18, transparent)`,
                    opacity: 0.7,
                    [flip ? "right" : "left"]: 0,
                }}
            />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-14"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-[2px] w-6 rounded-full" style={{ background: tagColor }} />
                        <span
                            className="text-xs font-bold uppercase tracking-[0.22em]"
                            style={{ color: tagColor }}
                        >
                            {tag}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">{title}</h2>
                        <p className="text-gray-400 text-lg leading-relaxed lg:max-w-md">{subtitle}</p>
                    </div>
                </motion.div>

                {/* Body: feature grid + mockup */}
                <div
                    className={`grid grid-cols-1 lg:grid-cols-5 gap-8 items-start ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}
                >
                    {/* Cards */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cards.map((card, i) => (
                            <FeatureCard key={i} card={card} index={i} />
                        ))}
                    </div>

                    {/* Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: flip ? -40 : 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                        className="lg:col-span-2 lg:sticky lg:top-28"
                    >
                        {mockup}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ─── Mockups ────────────────────────────────────────────────────
function StudentMockup() {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: "rgba(8,8,22,0.95)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            {/* Window bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                {["#ef4444", "#f59e0b", "#10b981"].map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
                <div className="ml-3 h-4 flex-1 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="p-5">
                <div className="text-white font-bold text-sm mb-1">Career Progress</div>
                <div className="text-gray-500 text-xs mb-4">Full-Stack Dev Track</div>
                <div className="h-2 rounded-full mb-5" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "78%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #4f46e5, #818cf8)" }}
                    />
                </div>
                {[
                    { n: "React / Next.js", p: 85, c: "#4f46e5" },
                    { n: "Node.js", p: 70, c: "#6366f1" },
                    { n: "Cloud (AWS)", p: 40, c: "#818cf8" },
                    { n: "System Design", p: 50, c: "#a5b4fc" },
                ].map((s) => (
                    <div key={s.n} className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                            <span>{s.n}</span>
                            <span className="text-gray-400">{s.p}%</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${s.p}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                                className="h-full rounded-full"
                                style={{ background: s.c }}
                            />
                        </div>
                    </div>
                ))}
                <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <div className="flex gap-2 items-start">
                        <span>🤖</span>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Focus on <span className="text-indigo-400 font-medium">System Design</span> next to unlock senior-level matches.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CollegeMockup() {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: "rgba(6,6,18,0.96)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                {["#ef4444", "#f59e0b", "#10b981"].map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
                <span className="ml-3 text-gray-600 text-xs">Admin Overview</span>
            </div>
            <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                        { l: "Students", v: "1,248", c: "#818cf8" },
                        { l: "Placement", v: "94%", c: "#6366f1" },
                        { l: "Tokens", v: "316 active", c: "#2563eb" },
                        { l: "Avg Score", v: "8.4 / 10", c: "#a5b4fc" },
                    ].map((s) => (
                        <div key={s.l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="text-xl font-black mb-0.5" style={{ color: s.c }}>{s.v}</div>
                            <div className="text-gray-600 text-[10px]">{s.l}</div>
                        </div>
                    ))}
                </div>
                <div className="text-gray-600 text-xs uppercase tracking-widest mb-3">Recent Activity</div>
                {[
                    { name: "Priya S.", action: "matched with Google", dot: "#818cf8" },
                    { name: "Rahul K.", action: "completed React track", dot: "#6366f1" },
                    { name: "Ananya M.", action: "joined via token", dot: "#a5b4fc" },
                ].map((a) => (
                    <div key={a.name} className="flex items-center gap-2.5 py-2 border-b border-white/[0.03] last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.dot }} />
                        <span className="text-gray-400 text-xs">
                            <span className="text-white font-medium">{a.name}</span> {a.action}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfessionalMockup() {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: "rgba(10,6,22,0.96)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                {["#ef4444", "#f59e0b", "#10b981"].map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
                <span className="ml-3 text-gray-600 text-xs">Growth Dashboard</span>
            </div>
            <div className="p-5">
                <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                        { l: "Mentees", v: "24" },
                        { l: "Sessions", v: "148" },
                        { l: "Rating", v: "4.9★" },
                    ].map((s) => (
                        <div key={s.l} className="text-center rounded-xl py-3" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div className="text-white font-black text-lg">{s.v}</div>
                            <div className="text-gray-600 text-[10px]">{s.l}</div>
                        </div>
                    ))}
                </div>
                <div className="text-gray-600 text-xs uppercase tracking-widest mb-3">Upcoming Sessions</div>
                {[
                    { name: "Arun M.", topic: "Career Switch to AI", time: "Today 4PM", c: "#6366f1" },
                    { name: "Sana K.", topic: "Portfolio Review", time: "Tomorrow 2PM", c: "#818cf8" },
                ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl mb-2 last:mb-0"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                            style={{ background: `${s.c}20`, border: `1px solid ${s.c}30`, color: s.c }}>
                            {s.name[0]}
                        </div>
                        <div>
                            <div className="text-white text-xs font-semibold">{s.name}</div>
                            <div className="text-gray-600 text-[10px]">{s.topic}</div>
                        </div>
                        <div className="ml-auto text-gray-600 text-[10px] whitespace-nowrap">{s.time}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Exported Sections ──────────────────────────────────────────
const studentCards: CardData[] = [
    {
        number: "01 — Pathfinding",
        title: "AI Career Planning",
        desc: "Advanced algorithms map your strengths to market demand, building precise career pathways.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Compass,
    },
    {
        number: "02 — Intelligence",
        title: "Skill Gap Analysis",
        desc: "Real-time tracking of what you know vs. what your target role demands, with adaptive micro-recommendations.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Target,
    },
    {
        number: "03 — Growth",
        title: "Progress Analytics",
        desc: "Live dashboards showing academic milestones, skill velocity, and projected career trajectory.",
        accent: ["#2563eb", "#7c3aed"],
        icon: TrendingUp,
    },
    {
        number: "04 — Learning",
        title: "Curated Resources",
        desc: "Hand-picked courses and projects matched to your current level and target goals.",
        accent: ["#2563eb", "#7c3aed"],
        icon: BookOpen,
    },
    {
        number: "05 — Network",
        title: "Expert Connections",
        desc: "Matched with industry mentors and career counselors who have walked your exact target path.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Users,
    },
    {
        number: "06 — Foresight",
        title: "Future Insights",
        desc: "Forecasted job market shifts, emerging tech stacks, and upcoming hiring trends in your field.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Sparkles,
    },
];

const collegeCards: CardData[] = [
    {
        number: "01 — Control",
        title: "Admin Dashboard",
        desc: "Centralised command center for managing students, programs, and placements in real time.",
        accent: ["#2563eb", "#7c3aed"],
        icon: SlidersHorizontal,
    },
    {
        number: "02 — Insight",
        title: "Deep Analytics",
        desc: "Student performance, cohort engagement, and career readiness scoring at a glance.",
        accent: ["#2563eb", "#7c3aed"],
        icon: PieChart,
    },
    {
        number: "03 — Outcome",
        title: "Placement Tracker",
        desc: "Full placement pipeline — from first offer to final acceptance — with live status boards.",
        accent: ["#2563eb", "#7c3aed"],
        icon: CheckCircle,
    },
    {
        number: "04 — Access",
        title: "Token Management",
        desc: "Per-college access tokens with configurable usage limits, expiry, and tracking.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Key,
    },
    {
        number: "05 — Content",
        title: "Curriculum Upload",
        desc: "Ingest syllabi to power AI-driven recommendations and skill gap mapping for students.",
        accent: ["#2563eb", "#7c3aed"],
        icon: FileText,
    },
    {
        number: "06 — Connect",
        title: "Integrations",
        desc: "Plug seamlessly into your existing ERP, LMS, and third-party tools. No rip-and-replace.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Plug,
    },
];

const proCards: CardData[] = [
    {
        number: "01 — Overview",
        title: "Growth Dashboard",
        desc: "Track mentorship impact, professional milestones, and skill development in one command center.",
        accent: ["#2563eb", "#7c3aed"],
        icon: LayoutDashboard,
    },
    {
        number: "02 — Mentorship",
        title: "Student Matching",
        desc: "AI-matched connections with students who align with your expertise and availability.",
        accent: ["#2563eb", "#7c3aed"],
        icon: UserPlus,
    },
    {
        number: "03 — Learning",
        title: "Upskilling Hub",
        desc: "Curated professional development resources to keep your edge sharp in a fast-moving market.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Lightbulb,
    },
    {
        number: "04 — Projects",
        title: "Collaboration Hub",
        desc: "Track open-source contributions, joint projects, and professional engagements in one place.",
        accent: ["#2563eb", "#7c3aed"],
        icon: Briefcase,
    },
];

export function StudentsSection() {
    return (
        <Section
            id="students-section"
            tag="For Students"
            tagColor="#818cf8"
            title={
                <>
                    Your Personal{" "}
                    <span style={{ color: "#818cf8" }}>
                        AI Advisor
                    </span>
                </>
            }
            subtitle="Stop guessing your career path. Our AI builds a personalized roadmap based on your skills, interests, and market demand — then adapts as you grow."
            cards={studentCards}
            mockup={<StudentMockup />}
            bg="#030309"
        />
    );
}

export function CollegesSection() {
    return (
        <Section
            id="colleges-section"
            tag="For Colleges & Institutions"
            tagColor="#818cf8"
            flip
            title={
                <>
                    Institutional{" "}
                    <span style={{ color: "#818cf8" }}>
                        Intelligence
                    </span>
                </>
            }
            subtitle="Give your institution a competitive edge. Track placements, manage students at scale, and make data-driven decisions with confidence."
            cards={collegeCards}
            mockup={<CollegeMockup />}
            bg="#030309"
        />
    );
}

export function ProfessionalsSection() {
    return (
        <Section
            id="professionals-section"
            tag="For Professionals & Mentors"
            tagColor="#818cf8"
            title={
                <>
                    Grow Your{" "}
                    <span style={{ color: "#818cf8" }}>
                        Impact
                    </span>
                </>
            }
            subtitle="Mentor the next generation, build your professional network, and accelerate your own career — all in one elegant platform."
            cards={proCards}
            mockup={<ProfessionalMockup />}
            bg="#030309"
        />
    );
}
