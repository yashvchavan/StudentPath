"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, GraduationCap, Building2, Briefcase } from "lucide-react";

const navItems = [
    { label: "Students", icon: GraduationCap, id: "students-section", color: "#818cf8" },
    { label: "Colleges", icon: Building2, id: "colleges-section", color: "#818cf8" },
    { label: "Professionals", icon: Briefcase, id: "professionals-section", color: "#818cf8" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <motion.header
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 w-full"
            style={{
                background: scrolled
                    ? "rgba(6,6,16,0.88)"
                    : "rgba(6,6,14,0.75)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                borderBottom: scrolled
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "1px solid rgba(255,255,255,0.04)",
                boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
            }}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

                {/* ── Logo ─────────────────────────────────────────── */}
                <Link href="/" className="flex-shrink-0">
                    <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2.5 cursor-pointer"
                    >
                        {/* Geometric mark */}
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <div
                                className="absolute inset-0 rounded-lg"
                                style={{
                                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                                    filter: "blur(5px)",
                                    opacity: 0.7,
                                    transform: "rotate(6deg) scale(1.1)",
                                }}
                            />
                            <div
                                className="absolute inset-0 rounded-lg flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                }}
                            >
                                <div
                                    className="w-3 h-3 rounded-[3px] rotate-45"
                                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.3))" }}
                                />
                            </div>
                        </div>

                        <span
                            className="text-[15px] font-black tracking-tight"
                            style={{
                                background: "linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            StudentPath
                        </span>
                    </motion.div>
                </Link>

                {/* ── Centre nav ───────────────────────────────────── */}
                <nav className="hidden md:flex items-center gap-0.5 rounded-xl px-1.5 py-1.5"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    {navItems.map((item, i) => {
                        const Icon = item.icon;
                        const active = hoveredIdx === i;
                        return (
                            <a
                                key={item.label}
                                href={`#${item.id}`}
                                onClick={scrollTo(item.id)}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className="relative flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer select-none"
                                style={{ transition: "all 0.18s ease" }}
                            >
                                <AnimatePresence>
                                    {active && (
                                        <motion.span
                                            layoutId="navhl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute inset-0 rounded-lg"
                                            style={{
                                                background: `${item.color}12`,
                                                border: `1px solid ${item.color}25`,
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                                <Icon
                                    className="w-3.5 h-3.5 flex-shrink-0 relative z-10"
                                    style={{ color: active ? item.color : "rgba(156,163,175,0.7)", transition: "color 0.18s ease" }}
                                />
                                <span
                                    className="text-sm font-medium relative z-10 whitespace-nowrap"
                                    style={{ color: active ? "#fff" : "rgba(156,163,175,0.75)", transition: "color 0.18s ease" }}
                                >
                                    {item.label}
                                </span>
                            </a>
                        );
                    })}
                </nav>

                {/* ── CTA ─────────────────────────────────────────── */}
                <Link href="/register-other" className="flex-shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden"
                        style={{
                            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                            boxShadow: "0 0 20px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
                        }}
                    >
                        <span className="relative z-10">Get Started</span>
                        <ArrowRight className="w-4 h-4 relative z-10" />
                        {/* shimmer */}
                        <motion.span
                            className="absolute inset-0 -skew-x-12"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)" }}
                            animate={{ x: ["-120%", "220%"] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
                        />
                    </motion.button>
                </Link>
            </div>
        </motion.header>
    );
}
