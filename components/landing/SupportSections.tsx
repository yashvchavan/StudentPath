"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, Send, Loader2, Mail, Clock, Twitter, Youtube, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";

// ── Shared bg color used across ALL sections ──────────────────────
const BG = "#030309"; // one single dark tone

// ── Variants ─────────────────────────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 48 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const fadeLeft: Variants = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" } },
};
const fadeRight: Variants = {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" } },
};
const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};
const staggerFast: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};

// ── Animated Counter ─────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const duration = 2000;
                    const start = performance.now();
                    const tick = (now: number) => {
                        const p = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        setCount(Math.floor(eased * target));
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

// ── Section label line ───────────────────────────────────────────
function SectionLabel({ text, color }: { text: string; color: string }) {
    return (
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-6 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em]" style={{ color }}>
                {text}
            </span>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STATS SECTION
// ═══════════════════════════════════════════════════════════════════
export function StatsSection() {
    const stats = [
        { target: 10000, suffix: "+", label: "Students Guided", sub: "Across partner institutions", colorClass: "text-indigo-400" },
        { target: 95, suffix: "%", label: "Success Rate", sub: "Career placement accuracy", colorClass: "text-indigo-400" },
        { target: 500, suffix: "+", label: "Partner Colleges", sub: "And growing weekly", colorClass: "text-indigo-400" },
    ];

    return (
        <section id="stats-section" className="relative py-24 px-6" style={{ background: "transparent" }}>
            {/* Divider glow line */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(79,70,229,0.3), transparent)" }}
            />

            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            variants={fadeUp}
                            whileHover={{ y: -6, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className="group relative p-8 rounded-2xl text-center overflow-hidden"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.08) 0%, transparent 70%)" }}
                            />
                            {/* Top accent line */}
                            <div
                                className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(79,70,229,0.5), transparent)" }}
                            />

                            <div className={`text-5xl md:text-6xl font-black ${s.colorClass} mb-2 drop-shadow-sm`}>
                                <AnimatedCounter target={s.target} suffix={s.suffix} />
                            </div>
                            <div className="text-white font-bold text-base tracking-tight mb-1">{s.label}</div>
                            <div className="text-gray-600 text-xs tracking-wide">{s.sub}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════
// CTA SECTION
// ═══════════════════════════════════════════════════════════════════
export function CTASection() {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section
            ref={ref}
            className="relative py-36 px-6 overflow-hidden"
            style={{ background: BG }}
        >
            {/* Grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                    maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
                }}
            />

            {/* Blobs with parallax */}
            <motion.div
                style={{ y, background: "radial-gradient(circle, rgba(79,70,229,0.25), transparent)" }}
                className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
            />
            <motion.div
                className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(79,70,229,0.15), transparent)", animation: "blobFloat 14s ease-in-out infinite" }}
            />

            <motion.div
                style={{ opacity }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={stagger}
                className="relative z-10 max-w-4xl mx-auto text-center"
            >
                <SectionLabel text="Get started today" color="#818cf8" />

                <motion.h2
                    variants={fadeUp}
                    className="text-5xl md:text-6xl lg:text-7xl font-black leading-none mb-6"
                >
                    <span className="text-white">Ready to unlock</span>
                    <br />
                    <span
                        style={{
                            color: "#818cf8"
                        }}
                    >
                        your potential?
                    </span>
                </motion.h2>

                <motion.p variants={fadeUp} className="text-gray-500 text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
                    Join thousands of students, colleges, and professionals already transforming their journey with StudentPath.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/register-other">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="group relative inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-white text-base overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                            }}
                        >
                            <span className="relative z-10">Start Free</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                        </motion.button>
                    </Link>

                    <a href="mailto:vijishvanya@gmail.com">
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-semibold text-gray-400 hover:text-white transition-colors duration-300 text-base"
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            Contact Sales
                        </motion.button>
                    </a>
                </motion.div>
            </motion.div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════════════════
function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [err, setErr] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setForm({ name: "", email: "", message: "" });
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
                setErr(data.error || "Failed to send");
            }
        } catch {
            setStatus("error");
            setErr("Network error. Try again.");
        }
    };

    const inputBase = {
        background: "rgba(255,255,255,0.03)",
        transition: "all 0.25s ease",
    };
    const inputStyle = (n: string) => ({
        ...inputBase,
        border: `1px solid ${focused === n ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: focused === n ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { label: "Name", name: "name", type: "text", placeholder: "Your name" },
                    { label: "Email", name: "email", type: "email", placeholder: "you@example.com" },
                ].map((f) => (
                    <div key={f.name}>
                        <label className="block text-[10px] font-extrabold text-gray-600 uppercase tracking-[0.2em] mb-2">{f.label}</label>
                        <input
                            type={f.type}
                            name={f.name}
                            value={form[f.name as keyof typeof form]}
                            onChange={handleChange}
                            onFocus={() => setFocused(f.name)}
                            onBlur={() => setFocused(null)}
                            required
                            placeholder={f.placeholder}
                            className="w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder-gray-700 outline-none"
                            style={inputStyle(f.name)}
                        />
                    </div>
                ))}
            </div>

            <div>
                <label className="block text-[10px] font-extrabold text-gray-600 uppercase tracking-[0.2em] mb-2">Message</label>
                <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    onFocus={() => setFocused("message")}
                    onBlur={() => setFocused(null)}
                    required
                    rows={5}
                    placeholder="Tell us about your goals or how we can help..."
                    className="w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder-gray-700 outline-none resize-none"
                    style={inputStyle("message")}
                />
            </div>

            {status === "success" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 text-emerald-400 text-sm font-medium"
                    style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
                    ✓ Message sent — we'll reply within 24 hours.
                </motion.div>
            )}
            {status === "error" && (
                <div className="rounded-xl p-4 text-red-400 text-sm"
                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    ✗ {err}
                </div>
            )}

            <button
                type="submit"
                disabled={status === "loading"}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-white text-sm disabled:opacity-50 hover:opacity-90 transition-opacity duration-200"
                style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                }}
            >
                {status === "loading" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                )}
            </button>
        </form>
    );
}

// ═══════════════════════════════════════════════════════════════════
// CONTACT SECTION
// ═══════════════════════════════════════════════════════════════════
export function ContactSection() {
    return (
        <section
            id="contact-section"
            className="relative py-32 px-6"
            style={{ background: BG }}
        >
            {/* top divider */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(79,70,229,0.25), transparent)" }}
            />

            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                >
                    {/* Header */}
                    <motion.div variants={fadeUp} className="mb-14">
                        <SectionLabel text="Contact" color="#6366f1" />
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                            Get in touch
                        </h2>
                        <p className="text-gray-600 text-base max-w-sm">
                            We'd love to hear from you.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Left info */}
                        <motion.div variants={fadeLeft} className="lg:col-span-2 space-y-4">
                            {/* Contact info */}
                            <div
                                className="rounded-2xl p-6"
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}
                            >
                                <h3 className="text-white font-bold text-base mb-4 tracking-tight">StudentPath</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-gray-600 text-[10px] uppercase tracking-[0.18em] mb-0.5">Email</div>
                                            <a href="mailto:vijishvanya@gmail.com"
                                                className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium">
                                                vijishvanya@gmail.com
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-gray-600 text-[10px] uppercase tracking-[0.18em] mb-0.5">Response Time</div>
                                            <div className="text-gray-400 text-sm">Within 24 hours</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick links */}
                            <div
                                className="rounded-2xl p-5"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                <div className="text-gray-600 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-4">Quick Actions</div>
                                <div className="space-y-2">
                                    <Link href="/register-other">
                                        <div className="group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 hover:border-indigo-500/30"
                                            style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
                                            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">Student Sign Up</span>
                                            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    </Link>
                                    <Link href="/college-login">
                                        <div className="group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 hover:border-indigo-500/30 mt-2"
                                            style={{ background: "rgba(79,70,229,0.04)", border: "1px solid rgba(79,70,229,0.09)" }}>
                                            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">College Login</span>
                                            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: form */}
                        <motion.div
                            variants={fadeRight}
                            className="lg:col-span-3 rounded-2xl p-8"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                            <ContactForm />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════
export function Footer() {
    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    const navLinks = [
        { label: "For Students", id: "students-section" },
        { label: "For Colleges", id: "colleges-section" },
        { label: "For Professionals", id: "professionals-section" },
        { label: "AI Technology", id: "ai-section" },
    ];

    const socials = [
        {
            label: "YouTube",
            icon: Youtube,
            href: "https://youtube.com",
            hoverColor: "#ef4444",
        },
        {
            label: "Instagram",
            icon: Instagram,
            href: "https://instagram.com",
            hoverColor: "#ec4899",
        },
        {
            label: "Twitter / X",
            icon: Twitter,
            href: "https://twitter.com",
            hoverColor: "#38bdf8",
        },
        {
            label: "LinkedIn",
            icon: Linkedin,
            href: "https://linkedin.com",
            hoverColor: "#60a5fa",
        },
    ];

    return (
        <footer
            className="relative py-16 px-6 overflow-hidden"
            style={{
                background: "linear-gradient(180deg, #060610 0%, #030309 100%)",
                borderTop: "1px solid rgba(79,70,229,0.12)",
                boxShadow: "0 -1px 0 rgba(79,70,229,0.05), 0 -40px 80px rgba(79,70,229,0.04) inset",
            }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Main grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand col */}
                    <div className="md:col-span-2">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 mb-5">
                            
                            <span
                                className="text-[15px] font-black tracking-tight"
                                style={{ background: "linear-gradient(135deg,#fff 40%,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                            >
                                StudentPath
                            </span>
                        </div>

                        <p className="text-gray-700 text-sm leading-relaxed max-w-xs mb-6">
                            AI-powered career intelligence for students, institutions, and professionals worldwide.
                        </p>

                        {/* Social icons */}
                        <div className="flex items-center gap-2">
                            {socials.map((s) => {
                                const Icon = s.icon;
                                return (
                                    <motion.a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        whileHover={{ y: -3, scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="group w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                            color: "rgba(156,163,175,0.6)",
                                        }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = s.hoverColor; (e.currentTarget as HTMLElement).style.borderColor = `${s.hoverColor}40`; (e.currentTarget as HTMLElement).style.background = `${s.hoverColor}10`; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(156,163,175,0.6)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </motion.a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Platform nav */}
                    <div>
                        <h4 className="text-gray-600 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-5">Platform</h4>
                        <ul className="space-y-3">
                            {navLinks.map((l) => (
                                <li key={l.label}>
                                    <button
                                        onClick={() => scrollTo(l.id)}
                                        className="text-gray-700 hover:text-indigo-400 transition-colors duration-200 text-sm text-left"
                                    >
                                        {l.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-gray-600 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-5">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/terms" className="text-gray-700 hover:text-indigo-400 transition-colors duration-200 text-sm">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-700 hover:text-indigo-400 transition-colors duration-200 text-sm">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={() => scrollTo("contact-section")}
                                    className="text-gray-700 hover:text-indigo-400 transition-colors duration-200 text-sm text-left"
                                >
                                    Contact
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Separator line */}
                <div className="h-px mb-8" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-700 text-xs">
                        © 2025 StudentPath. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy" className="text-gray-700 text-xs hover:text-gray-500 transition-colors">
                            Privacy
                        </Link>
                        <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
                        <Link href="/terms" className="text-gray-700 text-xs hover:text-gray-500 transition-colors">
                            Terms
                        </Link>
                        <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
                        <button
                            onClick={() => scrollTo("contact-section")}
                            className="text-gray-700 text-xs hover:text-gray-500 transition-colors"
                        >
                            Contact
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
