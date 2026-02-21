"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function HeroSection() {
    return (
        <section
            className="relative flex items-center justify-center overflow-hidden"
            style={{
                minHeight: "100vh",
                background: "transparent", // canvas is behind via SolarScrollAnimation
            }}
        >
            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 w-full flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 36 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                        style={{
                            background: "rgba(79,70,229,0.1)",
                            border: "1px solid rgba(79,70,229,0.25)",
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#818cf8" }}
                        />
                        <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "#a5b4fc" }}>
                            AI-Powered Career Intelligence
                        </span>
                    </motion.div>

                    <h1 className="font-black leading-none tracking-tighter mb-6">
                        <span className="block text-5xl md:text-7xl xl:text-8xl text-white">
                            Where
                        </span>
                        <span
                            className="block text-5xl md:text-7xl xl:text-8xl"
                            style={{
                                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                            }}
                        >
                            Knowledge
                        </span>
                        <span className="block text-5xl md:text-7xl xl:text-8xl text-white">
                            Meets{" "}
                            <span
                                style={{
                                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent"
                                }}
                            >
                                Success
                            </span>
                        </span>
                    </h1>

                    <p
                        className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
                        style={{ color: "rgba(209,213,219,0.85)" }}
                    >
                        Personalized AI career paths, skill intelligence, and expert mentorship —
                        built for every student, college, and professional.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register-other">
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #000000 100%)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                }}
                            >
                                <span className="relative z-10">Start Your Journey</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                            </motion.button>
                        </Link>

                        <button
                            onClick={() => document.getElementById("students-section")?.scrollIntoView({ behavior: "smooth" })}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-gray-300 text-base hover:text-white transition-colors duration-300"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            Explore Platform
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* Scroll hint */}
                {/* <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
                >
                    <span className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: "rgba(245,158,11,0.7)" }}>
                        Scroll to explore
                    </span>
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
                        style={{ border: "1px solid rgba(245,158,11,0.3)" }}
                    >
                        <div className="w-0.5 h-2 rounded-full" style={{ background: "rgba(245,158,11,0.7)" }} />
                    </motion.div>
                </motion.div> */}
            </div>
        </section>
    );
}
