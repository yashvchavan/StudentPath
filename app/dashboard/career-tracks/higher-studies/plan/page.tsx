"use client";

/**
 * Higher Studies Plan Page
 * Route: /dashboard/career-tracks/higher-studies/plan
 *
 * Generates and displays a personalized study plan for a competitive exam.
 * Uses ChatGPT API via /api/career-tracks/generate-plan.
 *
 * Receives target exam info via URL query params:
 *   - id: exam ID
 *   - name: exam short name
 *   - fullName: exam full name
 *   - skills: comma-separated syllabus topic names
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
    GraduationCap,
    Plus,
    CheckCircle2,
} from "lucide-react";
import PlanGeneratingLoader from "@/components/plan-generating-loader";

export default function HigherStudiesPlanPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();

    const [plan, setPlan] = useState<GeneratedPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
    const [addingPlan, setAddingPlan] = useState(false);
    const [planAdded, setPlanAdded] = useState(false);

    // Get query params
    const examId = searchParams.get("id") || "";
    const examName = searchParams.get("name") || "Unknown Exam";
    const examFullName = searchParams.get("fullName") || examName;
    const syllabusTopics = (searchParams.get("skills") || "").split(",").filter(Boolean);

    // Calculate weeks remaining based on exam timeline
    const calculateWeeksRemaining = (): number => {
        // Default: 16 weeks prep time
        const semester = studentData?.current_semester || 6;
        // Higher studies exams usually have longer prep times
        return Math.min(Math.max(12, (8 - semester) * 8), 24);
    };

    // Generate plan on page load
    useEffect(() => {
        if (!dataLoading && studentData && syllabusTopics.length > 0 && !plan) {
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
                    trackType: "higher-studies",
                    targetId: examId,
                    targetName: `${examName} (${examFullName})`,
                    requiredSkills: syllabusTopics,
                    studentSkills,
                    semester: studentData?.current_semester || 6,
                    timeRemainingWeeks: calculateWeeksRemaining(),
                    additionalContext: `This is a competitive exam preparation plan. Student's program: ${studentData?.program || "Engineering"}. GPA: ${studentData?.current_gpa || "Not available"}. The student needs to cover the full exam syllabus. Focus on high-weightage topics first.`,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setPlan(data.data);
            } else {
                setError(data.error || "Failed to generate study plan");
            }
        } catch (err) {
            console.error("Study plan generation error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlan = async () => {
        if (!plan || addingPlan) return;
        setAddingPlan(true);
        try {
            const res = await fetch("/api/career-tracks/my-plan/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetId: examId,
                    targetName: `${examName} (${examFullName})`,
                    trackType: "higher-studies",
                    milestones: plan.milestones,
                    difficulty: "medium",
                }),
            });
            const data = await res.json();
            if (data.success) setPlanAdded(true);
        } catch (err) {
            console.error("Error adding plan:", err);
        } finally {
            setAddingPlan(false);
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
                        onClick={() => router.push("/dashboard/career-tracks/higher-studies")}
                        className="hover:bg-muted/80"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">Study Plan</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4" />
                            <span>Personalized plan for {examName} — {examFullName}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generatePlan}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Regenerate
                        </Button>
                        {plan && !loading && (
                            planAdded ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                                    onClick={() => router.push("/dashboard/career-tracks/my-plan")}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    View My Plan
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleAddPlan}
                                    disabled={addingPlan}
                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
                                >
                                    {addingPlan ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Add This Plan
                                </Button>
                            )
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <PlanGeneratingLoader targetName={examName} trackType="higher-studies" />
                )}


                {/* Error State */}
                {error && !loading && (
                    <Card className="border-destructive/20">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                <div>
                                    <p className="font-medium text-foreground">Study Plan Generation Failed</p>
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
                        <Card className="border-secondary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-secondary" />
                                    Study Plan Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">{plan.summary}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-secondary">{plan.totalWeeks}</p>
                                        <p className="text-xs text-muted-foreground">Weeks</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-secondary">{plan.milestones.length}</p>
                                        <p className="text-xs text-muted-foreground">Milestones</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-secondary">{syllabusTopics.length}</p>
                                        <p className="text-xs text-muted-foreground">Subjects</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold text-secondary">{plan.skillGaps.filter(g => g.current < 3).length}</p>
                                        <p className="text-xs text-muted-foreground">Weak Areas</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Syllabus Coverage Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-secondary" />
                                    Syllabus Coverage
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {plan.skillGaps.map((gap) => (
                                        <div key={gap.skill} className="flex items-center gap-4">
                                            <span className="text-sm w-52 truncate text-foreground">{gap.skill}</span>
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
                                            ) : gap.current >= 2 ? (
                                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-red-500" />
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
                                    <Clock className="w-5 h-5 text-secondary" />
                                    Recommended Daily Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{plan.dailySchedule}</p>
                            </CardContent>
                        </Card>

                        {/* Weekly Study Plan */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-secondary" />
                                    Weekly Study Plan
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
                                                <span className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm font-bold">
                                                    {milestone.week}
                                                </span>
                                                <span className="font-medium text-foreground">{milestone.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {milestone.targetSkills.map((skill) => (
                                                    <Badge key={skill} variant="outline" className="text-xs hidden sm:inline-flex">
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
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Study Tasks:</p>
                                                    <ul className="space-y-1.5">
                                                        {milestone.tasks.map((task, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                                                                {task}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {milestone.resources.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">Resources & References:</p>
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
                                        Study Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {plan.tips.map((tip, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <span className="text-yellow-500 mt-0.5">📚</span>
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
