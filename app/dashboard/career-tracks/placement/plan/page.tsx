"use client";

/**
 * Placement Plan Page
 * Route: /dashboard/career-tracks/placement/plan
 *
 * Generates and displays a personalized placement preparation plan.
 * Uses ChatGPT API via /api/career-tracks/generate-plan.
 *
 * Receives target company info via URL query params:
 *   - type: "on-campus" | "off-campus"
 *   - id: company ID
 *   - name: company name
 *   - skills: comma-separated required skills
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import ProgressRing from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentData } from "@/app/contexts/StudentDataContext";
import { useAuth } from "@/hooks/use-auth";
import type { GeneratedPlan } from "@/lib/career-tracks/plan-generator";
import {
    ArrowLeft,
    Sparkles,
    Check,
    AlertTriangle,
    Calendar,
    Target,
    BookOpen,
    Lightbulb,
    Clock,
    RefreshCw,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

export default function PlacementPlanPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();

    const [plan, setPlan] = useState<GeneratedPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

    // Get query params
    const companyType = searchParams.get("type") || "off-campus";
    const companyId = searchParams.get("id") || "";
    const companyName = searchParams.get("name") || "Unknown Company";
    const requiredSkills = (searchParams.get("skills") || "").split(",").filter(Boolean);

    // Calculate weeks remaining until a reasonable placement deadline
    const calculateWeeksRemaining = (): number => {
        const now = new Date();
        const semester = studentData?.current_semester || 6;
        // Assume placement season starts in August of final year (~semester 7)
        // So if sem 6 now, ~6 months → 24 weeks
        const weeksPerSemRemaining = Math.max(1, (8 - semester)) * 12;
        return Math.min(weeksPerSemRemaining, 24); // Cap at 24 weeks
    };

    // Generate plan on page load
    useEffect(() => {
        if (!dataLoading && studentData && requiredSkills.length > 0 && !plan) {
            generatePlan();
        }
    }, [dataLoading, studentData]);

    const generatePlan = async () => {
        setLoading(true);
        setError(null);

        try {
            const studentSkills = {
                ...(studentData?.technical_skills || {}),
                ...(studentData?.soft_skills || {}),
            };

            const res = await fetch("/api/career-tracks/generate-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trackType: "placement",
                    targetId: companyId,
                    targetName: companyName,
                    requiredSkills,
                    studentSkills,
                    semester: studentData?.current_semester || 6,
                    timeRemainingWeeks: calculateWeeksRemaining(),
                    additionalContext: `Company type: ${companyType}. Student's program: ${studentData?.program || "Engineering"}. Student's industry focus: ${studentData?.industry_focus?.join(", ") || "Not specified"}.`,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setPlan(data.data);
            } else {
                setError(data.error || "Failed to generate plan");
            }
        } catch (err) {
            console.error("Plan generation error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/career-tracks/placement")}
                        className="hover:bg-muted/80"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">Preparation Plan</h1>
                        <p className="text-sm text-muted-foreground">
                            Personalized plan for {companyName} ({companyType})
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={generatePlan}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Regenerate
                    </Button>
                </div>

                {/* Loading State */}
                {loading && (
                    <Card className="border-primary/20">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">Generating Your Plan...</h3>
                                    <p className="text-sm text-muted-foreground">
                                        AI is analyzing your skills and creating a personalized preparation plan
                                    </p>
                                </div>
                                <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card className="border-destructive/20">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                <div>
                                    <p className="font-medium text-foreground">Plan Generation Failed</p>
                                    <p className="text-sm text-muted-foreground">{error}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generatePlan}
                                    className="ml-auto"
                                >
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Plan Content */}
                {plan && !loading && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Plan Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">{plan.summary}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-primary">{plan.totalWeeks}</p>
                                        <p className="text-xs text-muted-foreground">Weeks</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-primary">{plan.milestones.length}</p>
                                        <p className="text-xs text-muted-foreground">Milestones</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-primary">{plan.skillGaps.filter(g => g.current < g.required).length}</p>
                                        <p className="text-xs text-muted-foreground">Skill Gaps</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-primary">{requiredSkills.length}</p>
                                        <p className="text-xs text-muted-foreground">Target Skills</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Skill Gap Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-secondary" />
                                    Skill Gap Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {plan.skillGaps.map((gap) => (
                                        <div key={gap.skill} className="flex items-center gap-4">
                                            <span className="text-sm w-40 truncate text-foreground">{gap.skill}</span>
                                            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${gap.current >= 4
                                                        ? "bg-green-500"
                                                        : gap.current >= 2
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${(gap.current / gap.required) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-12 text-right">
                                                {gap.current}/{gap.required}
                                            </span>
                                            {gap.current >= 4 ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Daily Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    Recommended Daily Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{plan.dailySchedule}</p>
                            </CardContent>
                        </Card>

                        {/* Weekly Milestones */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Weekly Milestones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {plan.milestones.map((milestone) => (
                                    <div
                                        key={milestone.week}
                                        className="border border-border/50 rounded-lg overflow-hidden"
                                    >
                                        <button
                                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                            onClick={() =>
                                                setExpandedWeek(
                                                    expandedWeek === milestone.week ? null : milestone.week
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                                    {milestone.week}
                                                </span>
                                                <span className="font-medium text-foreground">{milestone.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {milestone.targetSkills.map((skill) => (
                                                    <Badge key={skill} variant="secondary" className="text-xs hidden sm:inline-flex">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {expandedWeek === milestone.week ? (
                                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {expandedWeek === milestone.week && (
                                            <div className="px-4 pb-4 space-y-3 border-t border-border/50 animate-fade-in">
                                                <div className="pt-3">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Tasks:</p>
                                                    <ul className="space-y-1.5">
                                                        {milestone.tasks.map((task, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                                {task}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {milestone.resources.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">Resources:</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {milestone.resources.map((res, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    <BookOpen className="w-3 h-3 mr-1" />
                                                                    {res}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Tips */}
                        {plan.tips.length > 0 && (
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                                        Pro Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {plan.tips.map((tip, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <span className="text-yellow-500 mt-0.5">💡</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
