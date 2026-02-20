"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

// ── Orbital Sphere ───────────────────────────────────────────────
function OrbitalSphere() {
    return (
        <div className="relative w-72 h-72 mx-auto select-none">
            {/* outer pulse */}
            <div
                className="absolute inset-0 rounded-full opacity-15"
                style={{
                    background: "radial-gradient(circle, #6366f1, transparent)",
                    animation: "ping 4s cubic-bezier(0,0,0.2,1) infinite",
                }}
            />
            {/* aura glow */}
            <div
                className="absolute inset-4 rounded-full blur-3xl opacity-40"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.5), rgba(139,92,246,0.2), transparent)" }}
            />

            {/* orbit rings */}
            {[
                { i: "inset-2", dur: "18s", borderColor: "rgba(99,102,241,0.3)", rev: false },
                { i: "inset-8", dur: "13s", borderColor: "rgba(6,182,212,0.2)", rev: true },
                { i: "inset-14", dur: "9s", borderColor: "rgba(139,92,246,0.15)", rev: false },
            ].map((r, idx) => (
                <div
                    key={idx}
                    className={`absolute ${r.i} rounded-full`}
                    style={{
                        border: `1px solid ${r.borderColor}`,
                        animation: `spin ${r.dur} linear infinite`,
                        animationDirection: r.rev ? "reverse" : "normal",
                    }}
                />
            ))}

            {/* orbiting dots */}
            {[
                { color: "#6366f1", ring: "inset-2", dur: "6s" },
                { color: "#06b6d4", ring: "inset-8", dur: "9s" },
                { color: "#8b5cf6", ring: "inset-14", dur: "11s" },
            ].map((d, idx) => (
                <div
                    key={idx}
                    className={`absolute ${d.ring} flex items-start justify-center`}
                    style={{ animation: `spin ${d.dur} linear infinite`, animationDelay: `${idx * 0.5}s` }}
                >
                    <div
                        className="w-2.5 h-2.5 -mt-1.5 rounded-full"
                        style={{ background: d.color, boxShadow: `0 0 10px ${d.color}, 0 0 20px ${d.color}60` }}
                    />
                </div>
            ))}

            {/* core */}
            <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[22%] rounded-full"
                style={{
                    background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #0e7490 100%)",
                    boxShadow: "0 0 50px rgba(99,102,241,0.5), inset 0 2px 10px rgba(255,255,255,0.18), inset -6px -6px 15px rgba(0,0,0,0.3)",
                }}
            >
                <div className="absolute top-[15%] left-[18%] w-[32%] h-[22%] rounded-full bg-white/20 blur-md" />
            </motion.div>

            {/* floating data chips — no emojis, premium AI feel */}
            {[
                {
                    label: "AI Planning",
                    value: "Active",
                    dot: "#6366f1",
                    pos: "-right-8 -top-3",
                    delay: 0,
                    pulse: true,
                },
                {
                    label: "Match Score",
                    value: "95%",
                    dot: "#06b6d4",
                    pos: "-left-10 -bottom-2",
                    delay: 1.2,
                    pulse: false,
                },
                {
                    label: "Students",
                    value: "10,000+",
                    dot: "#8b5cf6",
                    pos: "-right-14 top-[46%]",
                    delay: 2.4,
                    pulse: false,
                },
            ].map((c, i) => (
                <motion.div
                    key={i}
                    animate={{ y: [0, i % 2 === 0 ? -7 : 7, 0] }}
                    transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
                    whileHover={{ scale: 1.06 }}
                    className={`absolute ${c.pos} flex items-center gap-2 px-3.5 py-2 rounded-2xl whitespace-nowrap cursor-default select-none`}
                    style={{
                        background: "rgba(8,8,20,0.75)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        border: `1px solid ${c.dot}30`,
                        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${c.dot}10`,
                    }}
                >
                    {/* LED indicator */}
                    <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                            background: c.dot,
                            boxShadow: `0 0 6px ${c.dot}`,
                            animation: c.pulse ? "ping 2s ease-in-out infinite" : undefined,
                        }}
                    />
                    <span className="text-[10px] font-medium tracking-wide" style={{ color: "rgba(156,163,175,0.75)" }}>
                        {c.label}
                    </span>
                    <span
                        className="text-[11px] font-black tracking-tight"
                        style={{ color: c.dot }}
                    >
                        {c.value}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 35, damping: 22 });
    const smoothY = useSpring(mouseY, { stiffness: 35, damping: 22 });

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 20);
            mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 20);
        };
        window.addEventListener("mousemove", handle);
        return () => window.removeEventListener("mousemove", handle);
    }, [mouseX, mouseY]);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center overflow-hidden"
            style={{
                background:
                    "radial-gradient(ellipse 80% 60% at 10% 50%, rgba(79,70,229,0.1) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 20%, rgba(6,182,212,0.07) 0%, transparent 45%), #020208",
            }}
        >
            {/* animated grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
                    backgroundSize: "80px 80px",
                    maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 100%)",
                }}
            />

            {/* blobs */}
            <div
                className="absolute top-24 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #6366f1, transparent)", animation: "blobFloat 12s ease-in-out infinite" }}
            />
            <div
                className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-8 pointer-events-none"
                style={{ background: "radial-gradient(circle, #06b6d4, transparent)", animation: "blobFloat 16s ease-in-out infinite", animationDelay: "-5s" }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1 className="font-black leading-none tracking-tighter mb-6">
                            <span className="block text-6xl md:text-7xl xl:text-8xl text-white">Where</span>
                            <span
                                className="block text-6xl md:text-7xl xl:text-8xl"
                                style={{
                                    background: "linear-gradient(135deg, #818cf8 0%, #06b6d4 55%, #a78bfa 100%)",
                                    backgroundSize: "200%",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    animation: "gradientShift 6s ease infinite",
                                }}
                            >
                                Knowledge
                            </span>
                            <span className="block text-6xl md:text-7xl xl:text-8xl text-white">
                                Meets{" "}
                                <span
                                    style={{
                                        background: "linear-gradient(135deg, #c4b5fd, #67e8f9)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    Success
                                </span>
                            </span>
                        </h1>

                        <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                            Personalized AI career paths, skill intelligence, and expert mentorship — built for every student, college, and professional.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/register-other">
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0891b2 100%)",
                                        boxShadow: "0 0 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                                    }}
                                >
                                    <span className="relative z-10">Start Your Journey</span>
                                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                                    <motion.span
                                        className="absolute inset-0 -skew-x-12"
                                        style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)" }}
                                        animate={{ x: ["-120%", "220%"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                                    />
                                </motion.button>
                            </Link>

                            <button
                                onClick={() => document.getElementById("students-section")?.scrollIntoView({ behavior: "smooth" })}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-gray-300 text-base hover:text-white transition-colors duration-300"
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    backdropFilter: "blur(20px)",
                                }}
                            >
                                Explore Platform
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Right */}
                <motion.div
                    style={{ rotateY: smoothX, rotateX: smoothY, perspective: "1200px" }}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-center"
                >
                    <OrbitalSphere />
                </motion.div>
            </div>
        </section>
    );
}
