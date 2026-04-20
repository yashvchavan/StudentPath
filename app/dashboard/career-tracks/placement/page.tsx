"use client";

/**
 * Campus Placements Page
 * Route: /dashboard/career-tracks/placement
 *
 * Shows college placement drives with:
 *  ◆ Year + department filters
 *  ◆ Status timeline (Upcoming / Ongoing / Completed)
 *  ◆ AI insight badge, prep plan generation
 *  ◆ Clean card grid with all drive details
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentData } from "@/app/contexts/StudentDataContext";
import { useAuth } from "@/hooks/use-auth";
import type { OnCampusProgram } from "@/lib/career-tracks/companies";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Users,
    IndianRupee,
    Layers,
    Star,
    Clock,
    Sparkles,
    AlertCircle,
    MessageSquare,
    Trophy,
    GraduationCap,
    Search,
    Filter,
    CheckCircle2,
    TimerIcon,
    Circle,
} from "lucide-react";

import { CompanyDetailsSheet } from "./components/CompanyDetailsSheet";
import { AIInsightsBadge } from "./components/AIInsightsBadge";
import { Input } from "@/components/ui/input";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    Upcoming: {
        label: "Upcoming",
        icon: TimerIcon,
        badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
        dotClass: "bg-blue-500",
    },
    Ongoing: {
        label: "Ongoing",
        icon: Circle,
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
        dotClass: "bg-emerald-500 animate-pulse",
    },
    Completed: {
        label: "Completed",
        icon: CheckCircle2,
        badgeClass: "bg-muted text-muted-foreground border-border/60",
        dotClass: "bg-muted-foreground",
    },
} as const;

type DriveStatus = keyof typeof STATUS_CONFIG;

export default function PlacementPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();

    const [onCampus, setOnCampus] = useState<OnCampusProgram[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [search, setSearch] = useState("");
    const [selectedYear, setSelectedYear] = useState<string>("All");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    const [detailsCompany, setDetailsCompany] = useState<OnCampusProgram | null>(null);

    const departments = ["All", "Computer", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML"];

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/career-tracks/companies");
            const data = await res.json();
            if (data.success) {
                const onCampusData: OnCampusProgram[] = data.data.onCampus || [];
                setOnCampus(onCampusData);

                const years = Array.from(
                    new Set(onCampusData.map((p) => p.academicYear).filter(Boolean))
                ) as string[];
                years.sort().reverse();
                setAvailableYears(years);
                if (years.length > 0) setSelectedYear(years[0]);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const handleGeneratePlan = (program: OnCampusProgram) => {
        const params = new URLSearchParams({
            type: "on-campus",
            id: program.id,
            name: program.companyName,
            skills: program.requiredSkills.join(","),
        });
        router.push(`/dashboard/career-tracks/placement/plan?${params.toString()}`);
    };

    // ── Filter logic ──────────────────────────────────────────────────────────
    const filtered = onCampus.filter((p) => {
        const matchesYear = selectedYear === "All" || p.academicYear === selectedYear;

        let searchTerms = [selectedDepartment.toLowerCase()];
        if (selectedDepartment === "Computer") searchTerms = ["computer", "cse", "c.s.e", "mzcs", "cs"];
        const matchesDept = selectedDepartment === "All" ||
            searchTerms.some((term) => p.eligibilityCriteria.toLowerCase().includes(term));

        const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;

        const q = search.toLowerCase();
        const matchesSearch = !q ||
            p.companyName.toLowerCase().includes(q) ||
            p.roleTitle.toLowerCase().includes(q) ||
            p.requiredSkills.some((s) => s.toLowerCase().includes(q));

        return matchesYear && matchesDept && matchesStatus && matchesSearch;
    });

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = {
        total: filtered.length,
        upcoming: filtered.filter((p) => p.status === "Upcoming").length,
        ongoing: filtered.filter((p) => p.status === "Ongoing").length,
        completed: filtered.filter((p) => p.status === "Completed").length,
    };

    if (authLoading || dataLoading || loading) {
        return (
            <DashboardLayout currentPage="career-tracks">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading placement drives...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="placement">
            <div className="space-y-6 pb-8 animate-fade-in">

                {/* ── Header ───────────────────────────────────────────────────── */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/career-tracks")}
                        className="hover:bg-muted/80 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Campus Placements</h1>
                                <p className="text-sm text-muted-foreground">
                                    College placement drives · Prepare smarter with AI
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats Bar ────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Drives", value: stats.total, color: "text-foreground", bg: "bg-card" },
                        { label: "Upcoming", value: stats.upcoming, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                        { label: "Ongoing", value: stats.ongoing, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                        { label: "Completed", value: stats.completed, color: "text-muted-foreground", bg: "bg-muted/40" },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className={`rounded-xl border border-border/60 p-4 text-center ${bg}`}>
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Info banner ──────────────────────────────────────────────── */}
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Placement drives are uploaded by your college's placement cell.
                        Click <span className="font-medium text-foreground">Prep Plan</span> to generate an AI-powered study roadmap for any drive.
                    </p>
                </div>

                {/* ── Filters Row ──────────────────────────────────────────────── */}
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search company, role, or skill..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>

                    {/* Year filter */}
                    {availableYears.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground mr-1">Year:</span>
                            <button
                                onClick={() => setSelectedYear("All")}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedYear === "All"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border/60 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                All Years
                            </button>
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedYear === year
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border/60 text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Status filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
                        {["All", "Upcoming", "Ongoing", "Completed"].map((status) => {
                            const cfg = status !== "All" ? STATUS_CONFIG[status as DriveStatus] : null;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedStatus === status
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : cfg
                                            ? cfg.badgeClass + " hover:opacity-80"
                                            : "border-border/60 text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />}
                                    {status}
                                </button>
                            );
                        })}
                    </div>

                    {/* Department filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-xs font-medium text-muted-foreground mr-1 whitespace-nowrap">Dept:</span>
                        {departments.map((dept) => (
                            <button
                                key={dept}
                                onClick={() => setSelectedDepartment(dept)}
                                className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${selectedDepartment === dept
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border/60 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Drive Cards ──────────────────────────────────────────────── */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border/60 rounded-xl">
                        <GraduationCap className="w-10 h-10 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">No placement drives found</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Try changing the year, department, or status filter
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearch("");
                                setSelectedYear(availableYears[0] || "All");
                                setSelectedDepartment("All");
                                setSelectedStatus("All");
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((program) => {
                            const statusCfg = STATUS_CONFIG[program.status as DriveStatus] || STATUS_CONFIG.Upcoming;
                            const StatusIcon = statusCfg.icon;

                            return (
                                <div
                                    key={program.id}
                                    className="group border border-border/60 rounded-2xl bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                                >
                                    {/* Status accent strip */}
                                    <div className={`h-1 w-full ${
                                        program.status === "Ongoing" ? "bg-emerald-500"
                                        : program.status === "Upcoming" ? "bg-blue-500"
                                        : "bg-muted"
                                    }`} />

                                    <div className="p-5 flex flex-col gap-4 flex-1">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-3xl leading-none flex-shrink-0">{program.logo}</span>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                                                        {program.companyName}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{program.roleTitle}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${statusCfg.badgeClass}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                                                    {program.status}
                                                </span>
                                                {program.academicYear && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {program.academicYear}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Package */}
                                        <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-3 py-2">
                                            <IndianRupee className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{program.package}</span>
                                        </div>

                                        {/* Dates row */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="truncate">
                                                    {program.driveDate && new Date(program.driveDate).getFullYear() !== 1970
                                                        ? new Date(program.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                                        : program.academicYear || "TBA"
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="truncate">
                                                    {program.registrationDeadline && new Date(program.registrationDeadline).getFullYear() !== 1970
                                                        ? `Closes ${new Date(program.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                                                        : "Deadline TBA"
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Eligibility */}
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">Eligible: </span>
                                            <span className="text-foreground">{program.eligibilityCriteria || "All departments"}</span>
                                        </div>

                                        {/* Required Skills */}
                                        <div>
                                            <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Required Skills</p>
                                            <div className="flex flex-wrap gap-1">
                                                {program.requiredSkills.slice(0, 5).map((skill) => (
                                                    <Badge key={skill} variant="secondary" className="text-[10px] h-5 font-normal">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {program.requiredSkills.length > 5 && (
                                                    <Badge variant="outline" className="text-[10px] h-5">
                                                        +{program.requiredSkills.length - 5}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Interview Rounds */}
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                                                    {program.rounds.length} Interview Round{program.rounds.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {program.rounds.map((round, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full"
                                                    >
                                                        <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        {round.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AI Insights */}
                                        <AIInsightsBadge
                                            extractedSkills={program.extracted_skills}
                                            extractedRounds={program.extracted_rounds}
                                            difficultyLevel={program.difficulty_level}
                                            totalRounds={program.total_rounds}
                                            confidenceScore={program.ai_confidence_score}
                                            lastAIUpdate={program.last_ai_update}
                                        />

                                        {/* Applicants */}
                                        {program.totalApplicants && program.totalApplicants > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{program.totalApplicants} applicants registered</span>
                                            </div>
                                        )}

                                        {/* Actions — push to bottom */}
                                        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs gap-1.5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailsCompany(program);
                                                }}
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Reviews
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="w-full text-xs gap-1.5 group/btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGeneratePlan(program);
                                                }}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Prep Plan
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Company Details Sheet (existing component) */}
            <CompanyDetailsSheet
                isOpen={!!detailsCompany}
                onClose={() => setDetailsCompany(null)}
                company={detailsCompany}
                type="on-campus"
                onRefresh={fetchCompanies}
            />
        </DashboardLayout>
    );
}
