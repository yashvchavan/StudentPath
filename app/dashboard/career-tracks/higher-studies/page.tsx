"use client";

/**
 * Higher Studies Track Page
 * Route: /dashboard/career-tracks/higher-studies
 *
 * Shows competitive exams (GATE, CAT, CET, GRE) as rich cards.
 * Each card displays eligibility, syllabus progress, exam info.
 * Students can select an exam and generate a personalized study plan.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import ProgressRing from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentData } from "@/app/contexts/StudentDataContext";
import { useAuth } from "@/hooks/use-auth";
import type { Exam } from "@/lib/career-tracks/exams";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Clock,
    ExternalLink,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    GraduationCap,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

export default function HigherStudiesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();

    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedExam, setExpandedExam] = useState<string | null>(null);

    // Fetch exams from API
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch("/api/career-tracks/exams");
                const data = await res.json();
                if (data.success) {
                    setExams(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching exams:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    // Calculate a simple syllabus readiness score based on student's tech skills
    // This is a rough heuristic — will be more precise with actual syllabus tracking
    const calculateExamReadiness = (exam: Exam): number => {
        if (!studentData) return 0;

        const techSkills = studentData.technical_skills || {};
        const skillNames = Object.keys(techSkills).map((s) => s.toLowerCase());

        let matchCount = 0;
        let totalTopics = 0;

        exam.syllabusTopics.forEach((topic) => {
            totalTopics++;
            const topicWords = topic.name.toLowerCase().split(/\s+/);
            const subtopicWords = topic.subtopics.map((s) => s.toLowerCase());

            // Check if student has skills that match topic or subtopics
            const hasMatch = skillNames.some(
                (skill) =>
                    topicWords.some((tw) => skill.includes(tw) || tw.includes(skill)) ||
                    subtopicWords.some((st) => skill.includes(st) || st.includes(skill))
            );

            if (hasMatch) matchCount++;
        });

        // Also factor in GPA for academic readiness
        const gpa = parseFloat(studentData.current_gpa) || 0;
        const gpaFactor = Math.min(gpa / 10, 1);

        const topicMatch = totalTopics > 0 ? matchCount / totalTopics : 0;
        return Math.round((topicMatch * 60 + gpaFactor * 40));
    };

    // Navigate to study plan
    const handleGeneratePlan = (exam: Exam) => {
        const syllabusSkills = exam.syllabusTopics.map((t) => t.name);
        const params = new URLSearchParams({
            id: exam.id,
            name: exam.name,
            fullName: exam.fullName,
            skills: syllabusSkills.join(","),
        });
        router.push(`/dashboard/career-tracks/higher-studies/plan?${params.toString()}`);
    };

    // Category badge colors
    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Engineering": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "Management": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "General": return "bg-green-500/10 text-green-500 border-green-500/20";
            default: return "";
        }
    };

    if (authLoading || dataLoading || loading) {
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
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/career-tracks")}
                        className="hover:bg-muted/80"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Higher Studies Track</h1>
                        <p className="text-sm text-muted-foreground">
                            Explore competitive exams and get AI-powered study plans
                        </p>
                    </div>
                </div>

                {/* Exam Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map((exam) => {
                        const readiness = calculateExamReadiness(exam);
                        const isExpanded = expandedExam === exam.id;

                        return (
                            <Card
                                key={exam.id}
                                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{exam.icon}</span>
                                            <div>
                                                <CardTitle className="text-xl">{exam.name}</CardTitle>
                                                <p className="text-xs text-muted-foreground">{exam.fullName}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={getCategoryColor(exam.category)}>
                                            {exam.category}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground">{exam.description}</p>

                                    {/* Readiness + Exam Info */}
                                    <div className="flex items-center gap-6">
                                        <ProgressRing
                                            progress={readiness}
                                            size={90}
                                            strokeWidth={7}
                                            color="hsl(var(--secondary))"
                                        />
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-foreground">{exam.examDate}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-foreground">{exam.examDuration}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-foreground">{exam.totalMarks} marks</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Registration deadline */}
                                    <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                                        <div className="flex items-center gap-2 text-sm">
                                            <AlertCircle className="w-4 h-4 text-secondary" />
                                            <span className="text-muted-foreground">
                                                Registration: <strong className="text-foreground">{exam.registrationDeadline}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Eligibility Preview */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Eligibility:</p>
                                        <ul className="space-y-1">
                                            {exam.eligibility.slice(0, 2).map((req, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                                    {req}
                                                </li>
                                            ))}
                                            {exam.eligibility.length > 2 && !isExpanded && (
                                                <li className="text-xs text-primary cursor-pointer" onClick={() => setExpandedExam(exam.id)}>
                                                    +{exam.eligibility.length - 2} more...
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Expand / Collapse */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="w-4 h-4 mr-1" /> Show Less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4 mr-1" /> Show Syllabus & Details
                                            </>
                                        )}
                                    </Button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="space-y-4 pt-2 border-t border-border/50 animate-fade-in">
                                            {/* Full Eligibility */}
                                            {exam.eligibility.length > 2 && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Full Eligibility:</p>
                                                    <ul className="space-y-1">
                                                        {exam.eligibility.map((req, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                                                {req}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Syllabus Topics with Weightage */}
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                                    Syllabus Topics & Weightage:
                                                </p>
                                                <div className="space-y-2">
                                                    {exam.syllabusTopics.map((topic) => (
                                                        <div key={topic.id} className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-foreground">{topic.name}</span>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {topic.weight}%
                                                                </Badge>
                                                            </div>
                                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-secondary/70 rounded-full transition-all duration-500"
                                                                    style={{ width: `${topic.weight}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {topic.subtopics.slice(0, 4).map((sub) => (
                                                                    <span
                                                                        key={sub}
                                                                        className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                                                    >
                                                                        {sub}
                                                                    </span>
                                                                ))}
                                                                {topic.subtopics.length > 4 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{topic.subtopics.length - 4} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Passing Criteria */}
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Passing Criteria:</p>
                                                <p className="text-sm text-foreground">{exam.passingCriteria}</p>
                                            </div>

                                            {/* Official Website */}
                                            <a
                                                href={exam.officialWebsite}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-xs text-primary hover:underline"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Official Website
                                            </a>
                                        </div>
                                    )}

                                    {/* Generate Plan CTA */}
                                    <Button
                                        className="w-full group/btn"
                                        onClick={() => handleGeneratePlan(exam)}
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Study Plan
                                        <ArrowRight className="w-4 h-4 ml-auto transition-transform group-hover/btn:translate-x-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
