"use client";

/**
 * Resume Analyzer Dashboard
 * Route: /dashboard/resume
 *
 * 4-tab interface:
 * 1. Upload & Analyze — Drag-drop upload, company/role selector, analyze button
 * 2. Score Dashboard — ATS score visualization, section breakdown, feedback
 * 3. Compare — Same resume vs multiple companies comparison
 * 4. History — All resume versions with score timeline
 */

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import ProgressRing from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    FileText,
    Target,
    BarChart3,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Zap,
    Shield,
    ChevronDown,
    ChevronUp,
    Eye,
    RefreshCw,
    Building2,
    Briefcase,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Cell,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Resume {
    id: number;
    file_url: string;
    file_name: string;
    file_type: string;
    created_at: string;
    analyses: Analysis[];
    latest_score: number | null;
    total_analyses: number;
}

interface Analysis {
    id: number;
    resume_id: number;
    company_name: string;
    company_id: string;
    target_role: string;
    ats_score: number;
    section_scores: SectionScore[];
    feedback_json: any;
    rejection_reasons: RejectionReason[];
    skill_gaps: SkillGap[];
    improvement_steps: ImprovementStep[];
    created_at: string;
}

interface SectionScore {
    name: string;
    score: number;
    maxScore: number;
    details: string;
}

interface RejectionReason {
    reason: string;
    severity: "critical" | "major" | "minor";
    fix: string;
}

interface SkillGap {
    skill: string;
    importance: "must-have" | "good-to-have" | "bonus";
    currentLevel: "missing" | "basic" | "intermediate";
    recommendation: string;
}

interface ImprovementStep {
    priority: number;
    area: string;
    action: string;
    expectedImpact: string;
    timeEstimate: string;
}

interface CompanyOption {
    company_id: string;
    company_name: string;
    role: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
    if (score >= 80) return "hsl(142, 76%, 36%)";   // Green
    if (score >= 60) return "hsl(48, 96%, 53%)";     // Yellow
    if (score >= 40) return "hsl(25, 95%, 53%)";     // Orange
    return "hsl(0, 84%, 60%)";                        // Red
}

function getScoreLabel(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Weak";
}

function getSeverityIcon(severity: string) {
    switch (severity) {
        case "critical": return <XCircle className="w-4 h-4 text-red-500" />;
        case "major": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
        case "minor": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
}

function getSeverityBg(severity: string) {
    switch (severity) {
        case "critical": return "bg-red-500/10 border-red-500/20";
        case "major": return "bg-orange-500/10 border-orange-500/20";
        case "minor": return "bg-yellow-500/10 border-yellow-500/20";
        default: return "bg-gray-500/10 border-gray-500/20";
    }
}

function getImportanceBadge(importance: string) {
    switch (importance) {
        case "must-have": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Must-Have</Badge>;
        case "good-to-have": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">Good-to-Have</Badge>;
        case "bonus": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Bonus</Badge>;
        default: return null;
    }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ResumeDashboard() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState("upload");
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
    const [comparisons, setComparisons] = useState<Analysis[]>([]);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadedResume, setUploadedResume] = useState<Resume | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Analysis state
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Comparison state
    const [compareResumeId, setCompareResumeId] = useState<number | null>(null);

    // ─── Data Fetching ──────────────────────────────────────────────────────

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch("/api/resume/history", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setResumes(data.resumes);
                // Auto-select latest resume for upload tab
                if (data.resumes.length > 0 && !uploadedResume) {
                    setUploadedResume(data.resumes[0]);
                }
            }
        } catch (e) {
            console.error("Failed to fetch history:", e);
        }
    }, [uploadedResume]);

    const fetchCompanies = useCallback(async () => {
        try {
            const res = await fetch("/api/resume/companies", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                // Use a Map keyed by lowercase company name to deduplicate
                const companyMap = new Map<string, { id: string; name: string; roles: Set<string>; prefix: string }>();

                const addCompany = (id: string, name: string, role: string, prefix: string) => {
                    const key = name.toLowerCase().trim();
                    if (companyMap.has(key)) {
                        const existing = companyMap.get(key)!;
                        existing.roles.add(role);
                    } else {
                        companyMap.set(key, { id, name, roles: new Set([role]), prefix });
                    }
                };

                // Popular companies (Google, Microsoft, etc.) — priority prefix ⭐
                for (const c of data.data.popular || []) {
                    for (const role of c.roles || ["SDE"]) {
                        addCompany(c.id, c.name, role, "⭐");
                    }
                }

                // On-campus placements from DB — prefix 🏫
                for (const p of data.data.onCampus || []) {
                    addCompany(p.id, p.companyName, p.roleTitle || "SDE", "🏫");
                }

                // Off-campus companies — no prefix
                for (const c of data.data.offCampus || []) {
                    addCompany(c.id, c.name, c.roleType || "SDE", "");
                }

                // Flatten: one CompanyOption per (company, role) pair
                const opts: CompanyOption[] = [];
                for (const entry of companyMap.values()) {
                    const displayName = entry.prefix ? `${entry.prefix} ${entry.name}` : entry.name;
                    for (const role of entry.roles) {
                        opts.push({ company_id: entry.id, company_name: displayName, role });
                    }
                }

                setCompanies(opts);
            }
        } catch (e) {
            console.error("Failed to fetch companies:", e);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchHistory();
            fetchCompanies();
        }
    }, [authLoading, isAuthenticated, fetchHistory, fetchCompanies]);

    // ─── File Upload ────────────────────────────────────────────────────────

    const handleFile = async (file: File) => {
        if (!file) return;

        const validTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!validTypes.includes(file.type) && ext !== "pdf" && ext !== "docx") {
            alert("Please upload a PDF or DOCX file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Maximum size is 5MB.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/resume/upload", {
                method: "POST",
                body: formData,
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setUploadedResume({
                    ...data.resume,
                    analyses: [],
                    latest_score: null,
                    total_analyses: 0,
                });
                // Refresh history
                fetchHistory();
            } else {
                alert(data.error || "Upload failed");
            }
        } catch (e) {
            console.error("Upload error:", e);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    // ─── Analysis ───────────────────────────────────────────────────────────

    const handleAnalyze = async () => {
        if (!uploadedResume || !selectedCompany) return;

        const company = companies.find((c) => c.company_id === selectedCompany);
        if (!company) return;

        // Strip emoji prefix from company name
        const cleanName = company.company_name.replace(/^[⭐🏫]\s*/, "");

        setAnalyzing(true);
        try {
            const res = await fetch("/api/resume/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeId: uploadedResume.id,
                    companyId: selectedCompany,
                    companyName: cleanName,
                    targetRole: selectedRole || company.role,
                }),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setCurrentAnalysis(data.analysis);
                setActiveTab("results");
                fetchHistory();
            } else {
                alert(data.error || "Analysis failed");
            }
        } catch (e) {
            console.error("Analysis error:", e);
            alert("Analysis failed. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    // ─── Comparison ─────────────────────────────────────────────────────────

    const loadComparison = async (resumeId: number) => {
        try {
            const res = await fetch(`/api/resume/compare?resumeId=${resumeId}`, { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setComparisons(data.comparisons);
                setCompareResumeId(resumeId);
            }
        } catch (e) {
            console.error("Comparison fetch error:", e);
        }
    };

    // ─── Toggles ────────────────────────────────────────────────────────────

    const toggleSection = (key: string) =>
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

    // ─── Available roles for selected company ────────────────────────────────

    const rolesForCompany = selectedCompany
        ? [...new Set(companies.filter((c) => c.company_id === selectedCompany).map((c) => c.role))]
        : [];

    // Auto-set role when company changes
    useEffect(() => {
        if (rolesForCompany.length > 0 && !selectedRole) {
            setSelectedRole(rolesForCompany[0]);
        }
    }, [selectedCompany, rolesForCompany, selectedRole]);

    // ─── Loading state ──────────────────────────────────────────────────────

    if (authLoading) {
        return (
            <DashboardLayout currentPage="resume">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <DashboardLayout currentPage="resume">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Shield className="w-7 h-7 text-primary" />
                            ATS Resume Analyzer
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Score your resume against company-specific ATS requirements
                        </p>
                    </div>
                    {resumes.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {resumes.length} resume{resumes.length > 1 ? "s" : ""} uploaded
                        </Badge>
                    )}
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                        <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Upload &</span> Analyze
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <Target className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Score</span> Results
                        </TabsTrigger>
                        <TabsTrigger value="compare" className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Compare
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══ TAB 1: Upload & Analyze ═══════════════════════════════════ */}
                    <TabsContent value="upload" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Upload Area */}
                            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-primary" />
                                        Upload Resume
                                    </CardTitle>
                                    <CardDescription>PDF or DOCX, max 5MB</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`
                      flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer
                      transition-all duration-300 min-h-[200px]
                      ${dragActive
                                                ? "bg-primary/10 border-2 border-primary border-dashed scale-[1.02]"
                                                : "bg-muted/30 hover:bg-muted/50 border-2 border-transparent"
                                            }
                    `}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.docx"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                        />

                                        {uploading ? (
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground">Uploading & parsing resume...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                                    <FileText className="w-8 h-8 text-primary" />
                                                </div>
                                                <p className="text-sm font-medium text-foreground mb-1">
                                                    {dragActive ? "Drop your resume here" : "Drag & drop your resume"}
                                                </p>
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    or click to browse files
                                                </p>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    Supports PDF and DOCX
                                                </Badge>
                                            </>
                                        )}
                                    </div>

                                    {/* Uploaded file indicator */}
                                    {uploadedResume && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20
                                 flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {uploadedResume.file_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Ready to analyze • {new Date(uploadedResume.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] shrink-0">
                                                {uploadedResume.file_type.toUpperCase()}
                                            </Badge>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Company & Role Selector */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        Select Target
                                    </CardTitle>
                                    <CardDescription>Choose company and role to evaluate against</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Company Select */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-muted-foreground" />
                                            Target Company
                                        </label>
                                        <Select
                                            value={selectedCompany}
                                            onValueChange={(v) => {
                                                setSelectedCompany(v);
                                                setSelectedRole("");
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a company" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...new Map(companies.map((c) => [c.company_id, c])).values()].map((c) => (
                                                    <SelectItem key={c.company_id} value={c.company_id}>
                                                        {c.company_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Role Select */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                                            Target Role
                                        </label>
                                        <Select
                                            value={selectedRole}
                                            onValueChange={setSelectedRole}
                                            disabled={!selectedCompany}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rolesForCompany.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                                {/* Also allow common role types */}
                                                {["SDE", "Analyst", "Core", "Research"].filter(r => !rolesForCompany.includes(r)).map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Analyze Button */}
                                    <Button
                                        className="w-full h-12 text-base font-semibold mt-2"
                                        disabled={!uploadedResume || !selectedCompany || analyzing}
                                        onClick={handleAnalyze}
                                    >
                                        {analyzing ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                                Analyzing Resume...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Analyze Resume
                                            </>
                                        )}
                                    </Button>

                                    {!uploadedResume && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            Upload a resume first to enable analysis
                                        </p>
                                    )}

                                    {analyzing && (
                                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                            <p className="text-xs text-blue-400 text-center">
                                                Running ATS scan and generating AI feedback...
                                                <br />This may take 10-15 seconds
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ═══ TAB 2: Score Results ══════════════════════════════════════ */}
                    <TabsContent value="results" className="mt-6">
                        {!currentAnalysis ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Target className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">No analysis yet</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                        Upload a resume and run an analysis to see results
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("upload")}>
                                        Go to Upload
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {/* Score Hero */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="overflow-hidden">
                                        <div className="p-6 sm:p-8">
                                            <div className="flex flex-col md:flex-row items-center gap-8">
                                                {/* Score Ring */}
                                                <div className="relative">
                                                    <ProgressRing
                                                        progress={currentAnalysis.ats_score}
                                                        size={180}
                                                        strokeWidth={12}
                                                        color={getScoreColor(currentAnalysis.ats_score)}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <span className="text-4xl font-bold text-foreground">
                                                                {currentAnalysis.ats_score}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground block">/ 100</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Score Details */}
                                                <div className="flex-1 text-center md:text-left">
                                                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                                        <h2 className="text-2xl font-bold text-foreground">ATS Match Score</h2>
                                                        <Badge
                                                            className="text-xs"
                                                            style={{
                                                                backgroundColor: getScoreColor(currentAnalysis.ats_score) + "20",
                                                                color: getScoreColor(currentAnalysis.ats_score),
                                                                borderColor: getScoreColor(currentAnalysis.ats_score) + "40",
                                                            }}
                                                        >
                                                            {getScoreLabel(currentAnalysis.ats_score)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mb-4">
                                                        Evaluated against <strong>{currentAnalysis.company_name}</strong> — {currentAnalysis.target_role}
                                                    </p>

                                                    {/* Quick Stats */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        {currentAnalysis.section_scores?.map((s, i) => (
                                                            <div key={i} className="p-2 rounded-lg bg-muted/30 text-center">
                                                                <p className="text-lg font-bold text-foreground">
                                                                    {s.score}<span className="text-xs text-muted-foreground">/{s.maxScore}</span>
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground">{s.name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Overall Verdict */}
                                            {currentAnalysis.feedback_json?.overallVerdict && (
                                                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                    <p className="text-sm text-foreground italic">
                                                        &ldquo;{currentAnalysis.feedback_json.overallVerdict}&rdquo;
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>

                                {/* Section-wise Bar Chart */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-primary" />
                                                Section-wise Breakdown
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={currentAnalysis.section_scores?.map((s) => ({
                                                            name: s.name,
                                                            Score: s.score,
                                                            Max: s.maxScore - s.score,
                                                        }))}
                                                        layout="vertical"
                                                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                                    >
                                                        <XAxis type="number" domain={[0, 30]} hide />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="name"
                                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                                            width={75}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--card))",
                                                                border: "1px solid hsl(var(--border))",
                                                                borderRadius: "8px",
                                                                color: "hsl(var(--foreground))",
                                                            }}
                                                        />
                                                        <Bar dataKey="Score" stackId="a" radius={[0, 0, 0, 0]}>
                                                            {currentAnalysis.section_scores?.map((s, i) => (
                                                                <Cell key={i} fill={getScoreColor((s.score / s.maxScore) * 100)} />
                                                            ))}
                                                        </Bar>
                                                        <Bar dataKey="Max" stackId="a" fill="hsl(var(--muted))" opacity={0.3} radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Section Details */}
                                            <div className="mt-4 space-y-2">
                                                {currentAnalysis.section_scores?.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                                                    >
                                                        <span className="text-sm text-foreground">{s.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted-foreground">{s.details}</span>
                                                            <Badge variant="outline" className="text-xs font-mono">
                                                                {s.score}/{s.maxScore}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Rejection Reasons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card>
                                        <CardHeader
                                            className="cursor-pointer"
                                            onClick={() => toggleSection("rejections")}
                                        >
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <XCircle className="w-5 h-5 text-red-500" />
                                                    Why You Might Get Rejected
                                                    <Badge variant="secondary" className="text-xs ml-2">
                                                        {currentAnalysis.rejection_reasons?.length || 0}
                                                    </Badge>
                                                </CardTitle>
                                                {expandedSections.rejections ? (
                                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        <AnimatePresence>
                                            {(expandedSections.rejections !== false) && (
                                                <motion.div
                                                    initial={false}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <CardContent className="space-y-3">
                                                        {currentAnalysis.rejection_reasons?.map((r, i) => (
                                                            <div
                                                                key={i}
                                                                className={`p-4 rounded-lg border ${getSeverityBg(r.severity)}`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    {getSeverityIcon(r.severity)}
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-foreground">{r.reason}</p>
                                                                        <div className="mt-2 flex items-start gap-2">
                                                                            <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                                                            <p className="text-xs text-muted-foreground">{r.fix}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                                                                        {r.severity}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>
                                </motion.div>

                                {/* Skill Gaps */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card>
                                        <CardHeader
                                            className="cursor-pointer"
                                            onClick={() => toggleSection("skillGaps")}
                                        >
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                                    Skill Gap Analysis
                                                    <Badge variant="secondary" className="text-xs ml-2">
                                                        {currentAnalysis.skill_gaps?.length || 0}
                                                    </Badge>
                                                </CardTitle>
                                                {expandedSections.skillGaps ? (
                                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        <AnimatePresence>
                                            {(expandedSections.skillGaps !== false) && (
                                                <motion.div
                                                    initial={false}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <CardContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {currentAnalysis.skill_gaps?.map((sg, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="p-4 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors"
                                                                >
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-sm font-medium text-foreground">{sg.skill}</span>
                                                                        {getImportanceBadge(sg.importance)}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-xs text-muted-foreground">Level:</span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-[10px] ${sg.currentLevel === "missing"
                                                                                ? "text-red-400 border-red-400/30"
                                                                                : sg.currentLevel === "basic"
                                                                                    ? "text-yellow-400 border-yellow-400/30"
                                                                                    : "text-green-400 border-green-400/30"
                                                                                }`}
                                                                        >
                                                                            {sg.currentLevel}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">{sg.recommendation}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>
                                </motion.div>

                                {/* Improvement Steps */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-green-500" />
                                                Actionable Improvement Plan
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {currentAnalysis.improvement_steps?.map((step, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <span className="text-sm font-bold text-primary">{step.priority}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium text-foreground">{step.area}</span>
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {step.timeEstimate}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-foreground/80">{step.action}</p>
                                                        <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            {step.expectedImpact}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Bullet Suggestions */}
                                {currentAnalysis.feedback_json?.bulletSuggestions?.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                                    Resume Bullet Improvements
                                                </CardTitle>
                                                <CardDescription>Before vs After suggestions for your resume</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {currentAnalysis.feedback_json.bulletSuggestions.map((bs: any, i: number) => (
                                                    <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
                                                        <div className="p-3 bg-red-500/5 border-b border-border/50">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                                                <span className="text-[10px] font-medium text-red-400">BEFORE</span>
                                                            </div>
                                                            <p className="text-xs text-foreground/80">{bs.original}</p>
                                                        </div>
                                                        <div className="p-3 bg-green-500/5 border-b border-border/50">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                <span className="text-[10px] font-medium text-green-400">AFTER</span>
                                                            </div>
                                                            <p className="text-xs text-foreground/80">{bs.improved}</p>
                                                        </div>
                                                        <div className="p-2 bg-muted/20">
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Zap className="w-3 h-3 text-primary" />
                                                                {bs.reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* ═══ TAB 3: Compare ════════════════════════════════════════════ */}
                    <TabsContent value="compare" className="mt-6">
                        {resumes.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">No data to compare</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                        Analyze your resume against multiple companies to see a comparison
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {/* Resume Selector for comparison */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Select Resume to Compare</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {resumes.map((r) => (
                                                <Button
                                                    key={r.id}
                                                    variant={compareResumeId === r.id ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => loadComparison(r.id)}
                                                    className="text-xs"
                                                >
                                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                    {r.file_name}
                                                    {r.total_analyses > 0 && (
                                                        <Badge variant="secondary" className="ml-1.5 text-[10px]">
                                                            {r.total_analyses}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Comparison Chart */}
                                {comparisons.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-primary" />
                                                    Company Comparison
                                                </CardTitle>
                                                <CardDescription>
                                                    ATS scores across {comparisons.length} companies
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {/* Bar Chart Comparison */}
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={comparisons.map((c) => ({
                                                                company: c.company_name,
                                                                score: c.ats_score,
                                                                role: c.target_role,
                                                            }))}
                                                            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                                                        >
                                                            <XAxis
                                                                dataKey="company"
                                                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                                                angle={-35}
                                                                textAnchor="end"
                                                            />
                                                            <YAxis
                                                                domain={[0, 100]}
                                                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                                            />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: "hsl(var(--card))",
                                                                    border: "1px solid hsl(var(--border))",
                                                                    borderRadius: "8px",
                                                                    color: "hsl(var(--foreground))",
                                                                }}
                                                                formatter={(value: number) => [`${value}/100`, "ATS Score"]}
                                                            />
                                                            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                                                {comparisons.map((c, i) => (
                                                                    <Cell key={i} fill={getScoreColor(c.ats_score)} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Radar chart if enough data */}
                                                {comparisons.length >= 2 && comparisons[0]?.section_scores && (
                                                    <div className="mt-8">
                                                        <h3 className="text-sm font-medium text-foreground mb-4">Section-wise Comparison</h3>
                                                        <div className="h-72">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <RadarChart
                                                                    data={
                                                                        comparisons[0].section_scores?.map((s, idx) => {
                                                                            const point: any = { section: s.name };
                                                                            comparisons.forEach((c, ci) => {
                                                                                const sc = c.section_scores?.[idx];
                                                                                point[c.company_name] = sc
                                                                                    ? Math.round((sc.score / sc.maxScore) * 100)
                                                                                    : 0;
                                                                            });
                                                                            return point;
                                                                        }) || []
                                                                    }
                                                                >
                                                                    <PolarGrid stroke="hsl(var(--border))" />
                                                                    <PolarAngleAxis
                                                                        dataKey="section"
                                                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                                                    />
                                                                    <PolarRadiusAxis
                                                                        domain={[0, 100]}
                                                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                                                                    />
                                                                    {comparisons.slice(0, 4).map((c, i) => (
                                                                        <Radar
                                                                            key={c.company_name}
                                                                            name={c.company_name}
                                                                            dataKey={c.company_name}
                                                                            stroke={["hsl(var(--primary))", "#f59e0b", "#ef4444", "#8b5cf6"][i]}
                                                                            fill={["hsl(var(--primary))", "#f59e0b", "#ef4444", "#8b5cf6"][i]}
                                                                            fillOpacity={0.15}
                                                                        />
                                                                    ))}
                                                                    <Tooltip
                                                                        contentStyle={{
                                                                            backgroundColor: "hsl(var(--card))",
                                                                            border: "1px solid hsl(var(--border))",
                                                                            borderRadius: "8px",
                                                                            color: "hsl(var(--foreground))",
                                                                        }}
                                                                    />
                                                                </RadarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Comparison Cards */}
                                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {comparisons.map((c, i) => (
                                                        <div
                                                            key={i}
                                                            className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                                                            onClick={() => {
                                                                setCurrentAnalysis(c);
                                                                setActiveTab("results");
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-sm font-medium text-foreground">{c.company_name}</h4>
                                                                <div
                                                                    className="text-lg font-bold"
                                                                    style={{ color: getScoreColor(c.ats_score) }}
                                                                >
                                                                    {c.ats_score}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-2">{c.target_role}</p>
                                                            <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-1000"
                                                                    style={{
                                                                        width: `${c.ats_score}%`,
                                                                        backgroundColor: getScoreColor(c.ats_score),
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <Eye className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-[10px] text-muted-foreground">Click for details</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                {comparisons.length === 0 && compareResumeId && (
                                    <Card className="border-dashed">
                                        <CardContent className="py-10 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                No analyses found for this resume. Go to Upload & Analyze to run analyses.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* ═══ TAB 4: History ═════════════════════════════════════════════ */}
                    <TabsContent value="history" className="mt-6">
                        {resumes.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">No resume history</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                        Upload your first resume to get started
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("upload")}>
                                        Upload Resume
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {resumes.map((resume, ri) => (
                                    <motion.div
                                        key={resume.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: ri * 0.05 }}
                                    >
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{resume.file_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Uploaded {new Date(resume.created_at).toLocaleDateString("en-IN", {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {resume.latest_score !== null && (
                                                            <div className="text-center">
                                                                <p
                                                                    className="text-xl font-bold"
                                                                    style={{ color: getScoreColor(resume.latest_score) }}
                                                                >
                                                                    {resume.latest_score}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground">Latest</p>
                                                            </div>
                                                        )}
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {resume.file_type.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Analyses for this resume */}
                                                {resume.analyses.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                                            Analyses ({resume.total_analyses})
                                                        </p>
                                                        {resume.analyses.map((a, ai) => (
                                                            <div
                                                                key={ai}
                                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/20
                                           hover:bg-muted/40 transition-colors cursor-pointer"
                                                                onClick={() => {
                                                                    setCurrentAnalysis(a);
                                                                    setActiveTab("results");
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                                    <div>
                                                                        <p className="text-sm text-foreground">{a.company_name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{a.target_role}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="text-sm font-bold"
                                                                        style={{ color: getScoreColor(a.ats_score) }}
                                                                    >
                                                                        {a.ats_score}/100
                                                                    </div>
                                                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 rounded-lg bg-muted/10 text-center">
                                                        <p className="text-xs text-muted-foreground">
                                                            No analyses yet.{" "}
                                                            <button
                                                                className="text-primary hover:underline"
                                                                onClick={() => {
                                                                    setUploadedResume(resume);
                                                                    setActiveTab("upload");
                                                                }}
                                                            >
                                                                Analyze now
                                                            </button>
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => {
                                                            setUploadedResume(resume);
                                                            setActiveTab("upload");
                                                        }}
                                                    >
                                                        <Target className="w-3.5 h-3.5 mr-1" />
                                                        Analyze
                                                    </Button>
                                                    {resume.total_analyses >= 2 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => {
                                                                loadComparison(resume.id);
                                                                setActiveTab("compare");
                                                            }}
                                                        >
                                                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                                                            Compare
                                                        </Button>
                                                    )}
                                                    <a
                                                        href={resume.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-auto"
                                                    >
                                                        <Button variant="ghost" size="sm" className="text-xs">
                                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                                            View
                                                        </Button>
                                                    </a>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
