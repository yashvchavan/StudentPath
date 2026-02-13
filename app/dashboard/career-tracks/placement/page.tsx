"use client";

/**
 * Placement Track Page
 * Route: /dashboard/career-tracks/placement
 *
 * Two sections via Tabs:
 * 1. On-Campus — Admin-uploaded placement drives (static for now)
 * 2. Off-Campus — Company list with skills, rounds, package info
 *
 * Students can select a company and generate a personalized placement plan.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentData } from "@/app/contexts/StudentDataContext";
import { useAuth } from "@/hooks/use-auth";
import type { OnCampusProgram, Company } from "@/lib/career-tracks/companies";
import {
    ArrowLeft,
    Building2,
    Globe,
    Calendar,
    Users,
    IndianRupee,
    Layers,
    ChevronRight,
    Filter,
    Star,
    Clock,
    MapPin,
    Sparkles,
    AlertCircle,
    MessageSquare
} from "lucide-react";

import { CompanyDetailsSheet } from "./components/CompanyDetailsSheet";

export default function PlacementPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();

    const [onCampus, setOnCampus] = useState<OnCampusProgram[]>([]);
    const [offCampus, setOffCampus] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [detailsCompany, setDetailsCompany] = useState<OnCampusProgram | Company | null>(null);

    // Year and Department filtering state
    const [selectedYear, setSelectedYear] = useState<string>("All");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    const departments = ["All", "Computer", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML"];

    // Fetch companies from API
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch("/api/career-tracks/companies");
                const data = await res.json();
                if (data.success) {
                    const onCampusData = data.data.onCampus || [];
                    setOnCampus(onCampusData);
                    setOffCampus(data.data.offCampus || []);

                    // Extract unique years
                    const years = Array.from(new Set(onCampusData.map((p: OnCampusProgram) => p.academicYear).filter(Boolean))) as string[];
                    // Sort years descending (newest first)
                    years.sort().reverse();
                    setAvailableYears(years);

                    // Select first year by default if available
                    if (years.length > 0) {
                        setSelectedYear(years[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    // Filter off-campus companies by difficulty
    const filteredOffCampus = activeFilter === "all"
        ? offCampus
        : offCampus.filter((c) => c.difficulty === activeFilter);

    // Filter on-campus by year and department
    const filteredOnCampus = onCampus.filter(p => {
        const matchesYear = selectedYear === "All" || p.academicYear === selectedYear;

        let searchTerms = [selectedDepartment.toLowerCase()];
        if (selectedDepartment === "Computer") {
            searchTerms = ["computer", "cse", "c.s.e", "mzcs", "cs"];
        }

        const matchesDept = selectedDepartment === "All" ||
            searchTerms.some(term => p.eligibilityCriteria.toLowerCase().includes(term)) ||
            (selectedDepartment === "All" && p.eligibilityCriteria === "");

        return matchesYear && matchesDept;
    });

    // Navigate to plan generation page with selected company
    const handleGeneratePlan = (company: Company | OnCampusProgram, type: "on-campus" | "off-campus") => {
        const companyName = type === "on-campus"
            ? (company as OnCampusProgram).companyName
            : (company as Company).name;
        const skills = type === "on-campus"
            ? (company as OnCampusProgram).requiredSkills
            : (company as Company).requiredSkills;
        const id = company.id;

        const params = new URLSearchParams({
            type,
            id,
            name: companyName,
            skills: skills.join(","),
        });
        router.push(`/dashboard/career-tracks/placement/plan?${params.toString()}`);
    };

    // Status badge color helper
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Upcoming": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "Ongoing": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Completed": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
            default: return "";
        }
    };

    // Difficulty badge color helper
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Easy": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "Hard": return "bg-red-500/10 text-red-500 border-red-500/20";
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
                        <h1 className="text-2xl font-bold text-foreground">Placement Track</h1>
                        <p className="text-sm text-muted-foreground">
                            Explore on-campus drives and off-campus opportunities
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="on-campus" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                        <TabsTrigger value="on-campus" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> On-Campus
                        </TabsTrigger>
                        <TabsTrigger value="off-campus" className="flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Off-Campus
                        </TabsTrigger>
                    </TabsList>

                    {/* ── On-Campus Tab ───────────────────────────────────────── */}
                    <TabsContent value="on-campus" className="mt-6">
                        <div className="space-y-4">
                            {/* Info banner */}
                            <Card className="border-dashed border-primary/30 bg-primary/5">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">
                                            On-campus placement data is managed by your college administration.
                                            The drives listed below are based on your college's placement schedule.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-3">
                                {/* Year Filter Tabs */}
                                {availableYears.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        <span className="text-sm font-medium whitespace-nowrap mr-2">Academic Year:</span>
                                        {availableYears.map(year => (
                                            <Button
                                                key={year}
                                                variant={selectedYear === year ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedYear(year)}
                                                className="whitespace-nowrap rounded-full"
                                            >
                                                {year}
                                            </Button>
                                        ))}
                                        <Button
                                            variant={selectedYear === "All" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedYear("All")}
                                            className="whitespace-nowrap rounded-full"
                                        >
                                            All Years
                                        </Button>
                                    </div>
                                )}

                                {/* Department Filter Tabs */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    <span className="text-sm font-medium whitespace-nowrap mr-2">Department:</span>
                                    {departments.map(dept => (
                                        <Button
                                            key={dept}
                                            variant={selectedDepartment === dept ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedDepartment(dept)}
                                            className="whitespace-nowrap rounded-full"
                                        >
                                            {dept}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {filteredOnCampus.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>No placement drives found for this academic year.</p>
                                </div>
                            ) : (
                                /* Drive Cards */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredOnCampus.map((program) => (
                                        <Card
                                            key={program.id}
                                            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl">{program.logo}</span>
                                                        <div>
                                                            <CardTitle className="text-lg">{program.companyName}</CardTitle>
                                                            <p className="text-sm text-muted-foreground">{program.roleTitle}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant="outline" className={getStatusColor(program.status)}>
                                                            {program.status}
                                                        </Badge>
                                                        {program.academicYear && (
                                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                {program.academicYear}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Package */}
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4 text-green-500" />
                                                    <span className="font-semibold text-foreground">{program.package}</span>
                                                </div>

                                                {/* Drive Date */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {program.driveDate && new Date(program.driveDate).getFullYear() !== 1970
                                                            ? `Drive: ${new Date(program.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                                                            : `Academic Year: ${program.academicYear || "TBA"}`
                                                        }
                                                    </span>
                                                </div>

                                                {/* Deadline */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {program.registrationDeadline && new Date(program.registrationDeadline).getFullYear() !== 1970
                                                            ? `Register by: ${new Date(program.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                                                            : (program.academicYear ? `Academic Year: ${program.academicYear}` : "Deadline: TBA")
                                                        }
                                                    </span>
                                                </div>

                                                {/* Eligibility */}
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Eligibility: </span>
                                                    <span className="text-foreground">{program.eligibilityCriteria}</span>
                                                </div>

                                                {/* Required Skills */}
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {program.requiredSkills.map((skill) => (
                                                            <Badge
                                                                key={skill}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Interview Rounds */}
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">Interview Rounds:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {program.rounds.map((round, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {round.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Applicants count */}
                                                {program.totalApplicants && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Users className="w-4 h-4" />
                                                        <span>{program.totalApplicants} applicants</span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full group/btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetailsCompany(program);
                                                        }}
                                                    >
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        Experience
                                                    </Button>
                                                    <Button
                                                        className="w-full group/btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleGeneratePlan(program, "on-campus");
                                                        }}
                                                    >
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Prep Plan
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── Off-Campus Tab ──────────────────────────────────────── */}
                    <TabsContent value="off-campus" className="mt-6">
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground mr-2">Difficulty:</span>
                                {["all", "Easy", "Medium", "Hard"].map((filter) => (
                                    <Button
                                        key={filter}
                                        variant={activeFilter === filter ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveFilter(filter)}
                                        className="text-xs"
                                    >
                                        {filter === "all" ? "All" : filter}
                                    </Button>
                                ))}
                            </div>

                            {/* Company Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredOffCampus.map((company) => (
                                    <Card
                                        key={company.id}
                                        className={`
                      hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group
                      ${selectedCompany === company.id ? "ring-2 ring-primary" : ""}
                    `}
                                        onClick={() => setSelectedCompany(
                                            selectedCompany === company.id ? null : company.id
                                        )}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{company.logo}</span>
                                                    <div>
                                                        <CardTitle className="text-base">{company.name}</CardTitle>
                                                        <p className="text-xs text-muted-foreground">{company.roleType}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={getDifficultyColor(company.difficulty)}>
                                                    {company.difficulty}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {/* Package */}
                                            <div className="flex items-center gap-2">
                                                <IndianRupee className="w-4 h-4 text-green-500" />
                                                <span className="font-semibold text-sm text-foreground">{company.averagePackage}</span>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {company.description}
                                            </p>

                                            {/* Locations */}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span>{company.locations.join(", ")}</span>
                                            </div>

                                            {/* Required Skills */}
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1.5">Required Skills:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {company.requiredSkills.slice(0, 4).map((skill) => (
                                                        <Badge key={skill} variant="secondary" className="text-xs py-0">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {company.requiredSkills.length > 4 && (
                                                        <Badge variant="secondary" className="text-xs py-0">
                                                            +{company.requiredSkills.length - 4}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Interview Rounds count */}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Layers className="w-3 h-3" />
                                                <span>{company.interviewRounds.length} interview rounds</span>
                                            </div>

                                            {/* Expanded details when selected */}
                                            {selectedCompany === company.id && (
                                                <div className="pt-3 border-t border-border/50 space-y-2 animate-fade-in">
                                                    <p className="text-xs font-medium text-foreground">Interview Rounds:</p>
                                                    {company.interviewRounds.map((round, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                                                {idx + 1}
                                                            </span>
                                                            <span>{round.name}</span>
                                                            <Badge variant="outline" className="text-xs py-0 ml-auto">
                                                                {round.type}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Generate Plan Button */}
                                            <Button
                                                className="w-full mt-2 group/btn"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGeneratePlan(company, "off-campus");
                                                }}
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Prep Plan
                                                <ChevronRight className="w-4 h-4 ml-auto transition-transform group-hover/btn:translate-x-1" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <CompanyDetailsSheet
                    isOpen={!!detailsCompany}
                    onClose={() => setDetailsCompany(null)}
                    company={detailsCompany}
                    type="on-campus" // Currently strictly linking to on-campus for reviews as per user context (placed student)
                />
            </div>
        </DashboardLayout>
    );
}
