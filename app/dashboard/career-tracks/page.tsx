"use client";

/**
 * Career Tracks Landing Page
 * Route: /dashboard/career-tracks
 *
 * Displays two large interactive cards:
 * 1. Placement Track (On-Campus + Off-Campus)
 * 2. Higher Studies Track (Competitive Exams)
 *
 * Each card shows a progress ring with readiness %, description, and key stats.
 * Cards are clickable and navigate to their respective sub-routes.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import ProgressRing from "@/components/progress-ring";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudentData } from "@/app/contexts/StudentDataContext";
import { useAuth } from "@/hooks/use-auth";
import {
    Briefcase,
    GraduationCap,
    ArrowRight,
    Building2,
    Globe,
    BookOpen,
    Trophy,
    Sparkles,
    TrendingUp,
} from "lucide-react";

export default function CareerTracksPage() {
    const router = useRouter();
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    // Calculate readiness percentages based on student data
    const calculatePlacementReadiness = () => {
        if (!studentData) return 0;
        let score = 0;
        const techSkills = studentData.technical_skills || {};
        const softSkills = studentData.soft_skills || {};
        const skillCount = Object.keys(techSkills).length + Object.keys(softSkills).length;

        // Skills completeness (40%)
        score += Math.min(skillCount * 5, 40);

        // Semester progress (20%) - later semesters = more ready
        const semester = studentData.current_semester || 1;
        score += Math.min((semester / 8) * 20, 20);

        // GPA factor (20%)
        const gpa = parseFloat(studentData.current_gpa) || 0;
        score += Math.min((gpa / 10) * 20, 20);

        // Career goals set (20%)
        if (studentData.primary_goal) score += 10;
        if (studentData.industry_focus?.length > 0) score += 10;

        return Math.round(Math.min(score, 100));
    };

    const calculateStudiesReadiness = () => {
        if (!studentData) return 0;
        let score = 0;

        // Academic performance (40%)
        const gpa = parseFloat(studentData.current_gpa) || 0;
        score += Math.min((gpa / 10) * 40, 40);

        // Technical skills depth (30%)
        const techSkills = studentData.technical_skills || {};
        const avgLevel =
            Object.values(techSkills).reduce((a: number, b: any) => a + Number(b), 0) /
            Math.max(Object.keys(techSkills).length, 1) || 0;
        score += Math.min((avgLevel / 5) * 30, 30);

        // Semester (15%) - typically prepare in sem 5-6
        const semester = studentData.current_semester || 1;
        score += semester >= 5 ? 15 : (semester / 5) * 15;

        // Goals alignment (15%)
        if (studentData.primary_goal?.toLowerCase().includes("higher") ||
            studentData.primary_goal?.toLowerCase().includes("research") ||
            studentData.primary_goal?.toLowerCase().includes("study")) {
            score += 15;
        } else if (studentData.secondary_goal) {
            score += 7;
        }

        return Math.round(Math.min(score, 100));
    };

    const placementReadiness = calculatePlacementReadiness();
    const studiesReadiness = calculateStudiesReadiness();

    if (authLoading || dataLoading) {
        return (
            <DashboardLayout currentPage="career-tracks">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="career-tracks">
            <div className="space-y-8 animate-fade-in">
                {/* Page Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Career Tracks</h1>
                            <p className="text-muted-foreground">
                                Choose your path and get a personalized preparation plan
                            </p>
                        </div>
                    </div>
                </div>

                {/* Track Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ── Placement Track Card ───────────────────────────────── */}
                    <Card
                        className={`
              relative overflow-hidden cursor-pointer transition-all duration-500 group
              hover:shadow-2xl hover:-translate-y-2
              ${hoveredCard === "placement"
                                ? "ring-2 ring-primary/40 shadow-xl shadow-primary/10"
                                : "hover:ring-1 hover:ring-primary/20"
                            }
            `}
                        onClick={() => router.push("/dashboard/career-tracks/placement")}
                        onMouseEnter={() => setHoveredCard("placement")}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardContent className="p-8 relative z-10">
                            <div className="flex flex-col items-center text-center space-y-6">
                                {/* Icon + Title */}
                                <div className="relative">
                                    <div className={`
                    p-4 rounded-2xl transition-all duration-300
                    ${hoveredCard === "placement"
                                            ? "bg-primary/20 scale-110"
                                            : "bg-primary/10"
                                        }
                  `}>
                                        <Briefcase className="w-10 h-10 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground">Placement Track</h2>
                                    <p className="text-muted-foreground text-sm max-w-xs">
                                        Prepare for on-campus and off-campus placements with personalized plans
                                    </p>
                                </div>

                                {/* Progress Ring */}
                                <ProgressRing
                                    progress={placementReadiness}
                                    size={140}
                                    strokeWidth={10}
                                    color="hsl(var(--primary))"
                                />
                                <p className="text-sm text-muted-foreground -mt-2">Placement Readiness</p>

                                {/* Features */}
                                <div className="flex flex-wrap justify-center gap-2">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> On-Campus
                                    </Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> Off-Campus
                                    </Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> AI Plan
                                    </Badge>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-border/50">
                                    <div>
                                        <p className="text-lg font-bold text-foreground">10+</p>
                                        <p className="text-xs text-muted-foreground">Companies</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-foreground">4</p>
                                        <p className="text-xs text-muted-foreground">On-Campus Drives</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-foreground">AI</p>
                                        <p className="text-xs text-muted-foreground">Prep Plans</p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className={`
                  flex items-center gap-2 text-primary font-medium transition-all duration-300
                  ${hoveredCard === "placement" ? "translate-x-2" : ""}
                `}>
                                    Explore Placements
                                    <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${hoveredCard === "placement" ? "translate-x-1" : ""}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Higher Studies Track Card ──────────────────────────── */}
                    <Card
                        className={`
              relative overflow-hidden cursor-pointer transition-all duration-500 group
              hover:shadow-2xl hover:-translate-y-2
              ${hoveredCard === "studies"
                                ? "ring-2 ring-secondary/40 shadow-xl shadow-secondary/10"
                                : "hover:ring-1 hover:ring-secondary/20"
                            }
            `}
                        onClick={() => router.push("/dashboard/career-tracks/higher-studies")}
                        onMouseEnter={() => setHoveredCard("studies")}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardContent className="p-8 relative z-10">
                            <div className="flex flex-col items-center text-center space-y-6">
                                {/* Icon + Title */}
                                <div className="relative">
                                    <div className={`
                    p-4 rounded-2xl transition-all duration-300
                    ${hoveredCard === "studies"
                                            ? "bg-secondary/20 scale-110"
                                            : "bg-secondary/10"
                                        }
                  `}>
                                        <GraduationCap className="w-10 h-10 text-secondary" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground">Higher Studies Track</h2>
                                    <p className="text-muted-foreground text-sm max-w-xs">
                                        Prepare for GATE, CAT, CET, GRE with structured study plans
                                    </p>
                                </div>

                                {/* Progress Ring */}
                                <ProgressRing
                                    progress={studiesReadiness}
                                    size={140}
                                    strokeWidth={10}
                                    color="hsl(var(--secondary))"
                                />
                                <p className="text-sm text-muted-foreground -mt-2">Academic Readiness</p>

                                {/* Features */}
                                <div className="flex flex-wrap justify-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> GATE
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> CAT
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> CET
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> GRE
                                    </Badge>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-border/50">
                                    <div>
                                        <p className="text-lg font-bold text-foreground">4</p>
                                        <p className="text-xs text-muted-foreground">Exams</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-foreground">40+</p>
                                        <p className="text-xs text-muted-foreground">Topics</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-foreground">AI</p>
                                        <p className="text-xs text-muted-foreground">Study Plans</p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className={`
                  flex items-center gap-2 text-secondary font-medium transition-all duration-300
                  ${hoveredCard === "studies" ? "translate-x-2" : ""}
                `}>
                                    Explore Higher Studies
                                    <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${hoveredCard === "studies" ? "translate-x-1" : ""}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Tips Section */}
                <Card className="border-dashed">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-foreground">💡 Quick Tip</h3>
                                <p className="text-sm text-muted-foreground">
                                    {studentData?.current_semester && studentData.current_semester >= 5
                                        ? "You're in your final years — this is the best time to actively start placement or exam preparation. Pick a track and get your personalized AI-powered plan!"
                                        : "It's never too early to explore career tracks. Start building your skills now and you'll have a head start when placement season begins!"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
