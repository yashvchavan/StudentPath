"use client";

/**
 * Internship Track Page
 * Route: /dashboard/career-tracks/internships
 *
 * Three sections via Tabs:
 * 1. Available — College-posted internship openings
 * 2. My Applications — Student's applied internships with status
 * 3. Peer Experiences — Community-shared internship journey stories
 */

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    IndianRupee,
    Clock,
    Calendar,
    Users,
    Star,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Building2,
    Globe,
    Laptop,
    ChevronDown,
    ChevronUp,
    Plus,
    X,
    Search,
    Filter,
    BookOpen,
    Lightbulb,
    MessageSquare,
    TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useStudentData } from "@/app/contexts/StudentDataContext";

/* ── Types ── */
interface Round { name: string; description: string; }

interface Internship {
    id: number;
    company_name: string;
    logo_url?: string;
    role: string;
    stipend?: string;
    duration?: string;
    description?: string;
    eligibility?: string;
    location?: string;
    type: "remote" | "in-office" | "hybrid";
    start_date?: string;
    application_deadline?: string;
    apply_process?: string;
    rounds: Round[];
    required_skills: string[];
    perks?: string;
    application_count: number;
}

interface Application {
    application_id: number;
    internship_id: number;
    company_name: string;
    role: string;
    stipend?: string;
    duration?: string;
    location?: string;
    type: string;
    start_date?: string;
    application_deadline?: string;
    status: "applied" | "under_review" | "shortlisted" | "rejected" | "selected";
    applied_at: string;
}

interface Experience {
    id: number;
    internship_id?: number;
    company_name: string;
    role: string;
    duration?: string;
    stipend?: string;
    how_got_internship?: string;
    selection_rounds: { name: string; description: string }[];
    industry_experience?: string;
    tips_for_applicants?: string;
    rating?: number;
    is_currently_interning: boolean;
    start_date?: string;
    end_date?: string;
    student_display_name: string;
    program?: string;
    current_year?: number;
    created_at: string;
}

/* ── Helpers ── */
const STATUS_COLORS: Record<string, string> = {
    applied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    under_review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    shortlisted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    selected: "bg-green-500/10 text-green-500 border-green-500/20",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
    remote: <Globe className="w-3.5 h-3.5" />,
    "in-office": <Building2 className="w-3.5 h-3.5" />,
    hybrid: <Laptop className="w-3.5 h-3.5" />,
};

function StarRating({ value }: { value: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
            ))}
        </span>
    );
}

/* ── Main Component ── */
export default function InternshipsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { studentData, isLoading: dataLoading } = useStudentData();

    /* ─ Data state ─ */
    const [internships, setInternships] = useState<Internship[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);

    /* ─ UI state ─ */
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [applyDialog, setApplyDialog] = useState<Internship | null>(null);
    const [coverLetter, setCoverLetter] = useState("");
    const [applying, setApplying] = useState(false);
    const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

    /* ─ Share experience state ─ */
    const [shareDialog, setShareDialog] = useState(false);
    const [shareForm, setShareForm] = useState({
        company_name: "",
        role: "",
        duration: "",
        stipend: "",
        how_got_internship: "",
        selection_rounds: [] as { name: string; description: string }[],
        industry_experience: "",
        tips_for_applicants: "",
        rating: 5,
        is_currently_interning: false,
        start_date: "",
        end_date: "",
    });
    const [roundInput, setRoundInput] = useState({ name: "", description: "" });
    const [sharing, setSharing] = useState(false);

    /* ─ Fetch on mount ─ */
    useEffect(() => {
        Promise.all([fetchInternships(), fetchApplications(), fetchExperiences()])
            .finally(() => setLoading(false));
    }, []);

    const fetchInternships = async () => {
        try {
            const res = await fetch("/api/internships");
            const data = await res.json();
            if (data.success) setInternships(data.data);
        } catch (e) {
            console.error("[fetchInternships]", e);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/internships/my-applications");
            const data = await res.json();
            if (data.success) {
                setApplications(data.data);
                setAppliedIds(new Set(data.data.map((a: Application) => a.internship_id)));
            }
        } catch (e) {
            console.error("[fetchApplications]", e);
        }
    };

    const fetchExperiences = async () => {
        try {
            const res = await fetch("/api/internships/experiences");
            const data = await res.json();
            if (data.success) setExperiences(data.data);
        } catch (e) {
            console.error("[fetchExperiences]", e);
        }
    };

    /* ─ Apply ─ */
    const handleApply = async () => {
        if (!applyDialog) return;
        setApplying(true);
        try {
            const res = await fetch(`/api/internships/${applyDialog.id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cover_letter: coverLetter }),
            });
            const data = await res.json();
            if (data.success) {
                setAppliedIds(prev => new Set([...prev, applyDialog.id]));
                setApplyDialog(null);
                setCoverLetter("");
                fetchApplications();
            } else {
                alert(data.error || "Failed to apply");
            }
        } finally {
            setApplying(false);
        }
    };

    /* ─ Share experience ─ */
    const addShareRound = () => {
        if (!roundInput.name.trim()) return;
        setShareForm(prev => ({
            ...prev,
            selection_rounds: [...prev.selection_rounds, { name: roundInput.name.trim(), description: roundInput.description.trim() }],
        }));
        setRoundInput({ name: "", description: "" });
    };

    const handleShareExperience = async () => {
        if (!shareForm.company_name || !shareForm.role) {
            alert("Company name and role are required");
            return;
        }
        setSharing(true);
        try {
            const res = await fetch("/api/internships/experiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(shareForm),
            });
            const data = await res.json();
            if (data.success) {
                setShareDialog(false);
                setShareForm({
                    company_name: "", role: "", duration: "", stipend: "",
                    how_got_internship: "", selection_rounds: [],
                    industry_experience: "", tips_for_applicants: "",
                    rating: 5, is_currently_interning: false, start_date: "", end_date: "",
                });
                fetchExperiences();
            } else {
                alert(data.error || "Failed to share experience");
            }
        } finally {
            setSharing(false);
        }
    };

    /* ─ Filtered internships ─ */
    const filteredInternships = internships.filter(i => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || i.company_name.toLowerCase().includes(q) || i.role.toLowerCase().includes(q) ||
            i.required_skills.some(s => s.toLowerCase().includes(q));
        const matchesType = typeFilter === "all" || i.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (authLoading || dataLoading || loading) {
        return (
            <DashboardLayout currentPage="internships">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="internships">
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
                        <h1 className="text-2xl font-bold text-foreground">Internship Track</h1>
                        <p className="text-sm text-muted-foreground">
                            Explore opportunities, track applications & learn from peer experiences
                        </p>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
                            <div>
                                <p className="text-xl font-bold">{internships.length}</p>
                                <p className="text-xs text-muted-foreground">Open Internships</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <Send className="w-8 h-8 text-blue-500 p-1.5 bg-blue-500/10 rounded-lg" />
                            <div>
                                <p className="text-xl font-bold">{applications.length}</p>
                                <p className="text-xs text-muted-foreground">Applied</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-violet-500 p-1.5 bg-violet-500/10 rounded-lg" />
                            <div>
                                <p className="text-xl font-bold">{experiences.length}</p>
                                <p className="text-xs text-muted-foreground">Peer Stories</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="available" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full max-w-lg">
                        <TabsTrigger value="available" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Available
                        </TabsTrigger>
                        <TabsTrigger value="applications" className="flex items-center gap-2">
                            <Send className="w-4 h-4" /> My Applications
                        </TabsTrigger>
                        <TabsTrigger value="experiences" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Peer Stories
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Available Internships ── */}
                    <TabsContent value="available" className="space-y-4 mt-4">
                        {/* Search + Filters */}
                        <div className="flex gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search company, role or skill..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {["all", "in-office", "remote", "hybrid"].map(t => (
                                    <Button
                                        key={t}
                                        variant={typeFilter === t ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setTypeFilter(t)}
                                        className="capitalize"
                                    >
                                        {t === "all" ? "All" : t}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {filteredInternships.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">
                                        {internships.length === 0
                                            ? "No internship opportunities posted yet"
                                            : "No results match your search"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {internships.length === 0
                                            ? "Your college hasn't posted any internships yet. Check back later."
                                            : "Try adjusting your search or filters"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredInternships.map(internship => (
                                    <Card
                                        key={internship.id}
                                        className="overflow-hidden transition-all duration-200 hover:shadow-md"
                                    >
                                        <CardContent className="p-5">
                                            {/* Main row */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-base">{internship.company_name}</h3>
                                                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                            {TYPE_ICON[internship.type]} {internship.type}
                                                        </Badge>
                                                        {appliedIds.has(internship.id) && (
                                                            <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-primary font-medium">{internship.role}</p>

                                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                        {internship.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {internship.location}
                                                            </span>
                                                        )}
                                                        {internship.stipend && (
                                                            <span className="flex items-center gap-1">
                                                                <IndianRupee className="w-3 h-3" /> {internship.stipend}
                                                            </span>
                                                        )}
                                                        {internship.duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {internship.duration}
                                                            </span>
                                                        )}
                                                        {internship.application_deadline && (
                                                            <span className={`flex items-center gap-1 ${
                                                                new Date(internship.application_deadline) < new Date()
                                                                    ? "text-red-500"
                                                                    : ""
                                                            }`}>
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(internship.application_deadline) < new Date()
                                                                    ? "Deadline passed"
                                                                    : `Deadline: ${new Date(internship.application_deadline).toLocaleDateString()}`}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" /> {internship.application_count} applied
                                                        </span>
                                                    </div>

                                                    {internship.required_skills?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {internship.required_skills.map(skill => (
                                                                <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        disabled={
                                                            appliedIds.has(internship.id) ||
                                                            (!!internship.application_deadline &&
                                                                new Date(internship.application_deadline) < new Date())
                                                        }
                                                        onClick={() => { setApplyDialog(internship); setCoverLetter(""); }}
                                                        className="min-w-24"
                                                    >
                                                        {appliedIds.has(internship.id) ? (
                                                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Applied</>
                                                        ) : (
                                                            <><Send className="w-3.5 h-3.5 mr-1" /> Apply</>
                                                        )}
                                                    </Button>
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === internship.id ? null : internship.id)}
                                                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                                    >
                                                        {expandedId === internship.id
                                                            ? <><ChevronUp className="w-3 h-3" /> Less</>
                                                            : <><ChevronDown className="w-3 h-3" /> Details</>}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded section */}
                                            {expandedId === internship.id && (
                                                <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                                                    {internship.description && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
                                                                <BookOpen className="w-4 h-4 text-primary" /> About the Role
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">{internship.description}</p>
                                                        </div>
                                                    )}

                                                    {internship.eligibility && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
                                                                <Filter className="w-4 h-4 text-primary" /> Eligibility
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">{internship.eligibility}</p>
                                                        </div>
                                                    )}

                                                    {internship.rounds?.length > 0 && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                                                                <TrendingUp className="w-4 h-4 text-primary" /> Selection Rounds
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {internship.rounds.map((round, idx) => (
                                                                    <div key={idx} className="flex gap-3 items-start">
                                                                        <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                                                            {idx + 1}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium">{round.name}</p>
                                                                            {round.description && (
                                                                                <p className="text-xs text-muted-foreground">{round.description}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {internship.apply_process && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
                                                                <Send className="w-4 h-4 text-primary" /> How to Apply
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">{internship.apply_process}</p>
                                                        </div>
                                                    )}

                                                    {internship.perks && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
                                                                <Star className="w-4 h-4 text-yellow-500" /> Perks & Benefits
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">{internship.perks}</p>
                                                        </div>
                                                    )}

                                                    {internship.start_date && (
                                                        <p className="text-xs text-muted-foreground">
                                                            <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                                            Starts: {new Date(internship.start_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── My Applications ── */}
                    <TabsContent value="applications" className="space-y-4 mt-4">
                        {applications.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Send className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">No applications yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Browse available internships and apply to get started
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {applications.map(app => (
                                    <Card key={app.application_id}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{app.company_name}</h3>
                                                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[app.status]}`}>
                                                            {app.status.replace("_", " ")}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-primary">{app.role}</p>
                                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                                        {app.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {app.location}
                                                            </span>
                                                        )}
                                                        {app.stipend && (
                                                            <span className="flex items-center gap-1">
                                                                <IndianRupee className="w-3 h-3" /> {app.stipend}
                                                            </span>
                                                        )}
                                                        {app.duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {app.duration}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Applied {new Date(app.applied_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {app.status === "shortlisted" && (
                                                        <div className="text-xs text-purple-500 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Shortlisted!
                                                        </div>
                                                    )}
                                                    {app.status === "selected" && (
                                                        <div className="text-xs text-green-500 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Congratulations!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Application status tracker */}
                                            <div className="mt-4 pt-3 border-t border-border/50">
                                                <div className="flex items-center gap-1">
                                                    {["applied", "under_review", "shortlisted", "selected"].map((step, idx, arr) => {
                                                        const stepOrder = ["applied", "under_review", "shortlisted", "selected"];
                                                        const currentIdx = stepOrder.indexOf(app.status);
                                                        const stepIdx = stepOrder.indexOf(step);
                                                        const isActive = stepIdx === currentIdx;
                                                        const isPast = stepIdx < currentIdx && app.status !== "rejected";
                                                        const isRejected = app.status === "rejected";

                                                        return (
                                                            <div key={step} className="flex items-center flex-1">
                                                                <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                                    idx === 0 ? "hidden" : ""
                                                                } ${isPast || isActive ? "bg-primary" : "bg-muted"}`} />
                                                                <div className={`w-3 h-3 rounded-full shrink-0 transition-colors ${
                                                                    isRejected && isActive ? "bg-red-500" :
                                                                    isActive ? "bg-primary ring-2 ring-primary/30" :
                                                                    isPast ? "bg-primary" :
                                                                    "bg-muted"
                                                                }`} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex justify-between mt-1">
                                                    {["applied", "under_review", "shortlisted", "selected"].map(step => (
                                                        <span key={step} className={`text-[10px] ${
                                                            app.status === step ? "text-primary font-medium" : "text-muted-foreground"
                                                        }`}>
                                                            {step === "under_review" ? "Review" : step.charAt(0).toUpperCase() + step.slice(1)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Peer Experiences ── */}
                    <TabsContent value="experiences" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Learn from peers who've secured internships — their process, tips and experience
                            </p>
                            <Button size="sm" onClick={() => setShareDialog(true)} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Share Your Story
                            </Button>
                        </div>

                        {experiences.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">No stories shared yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Be the first to share your internship journey with your peers
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {experiences.map(exp => (
                                    <Card key={exp.id} className="overflow-hidden">
                                        <CardContent className="p-5 space-y-4">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold">{exp.company_name}</h3>
                                                        {exp.is_currently_interning && (
                                                            <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                                                                Currently Interning
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-primary">{exp.role}</p>
                                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                                        {exp.duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {exp.duration}
                                                            </span>
                                                        )}
                                                        {exp.stipend && (
                                                            <span className="flex items-center gap-1">
                                                                <IndianRupee className="w-3 h-3" /> {exp.stipend}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-muted-foreground">{exp.student_display_name}</p>
                                                    {exp.program && (
                                                        <p className="text-xs text-muted-foreground">{exp.program} · Year {exp.current_year}</p>
                                                    )}
                                                    {exp.rating && <StarRating value={exp.rating} />}
                                                </div>
                                            </div>

                                            {/* How they got it */}
                                            {exp.how_got_internship && (
                                                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                    <h4 className="text-xs font-semibold text-blue-500 mb-1 flex items-center gap-1">
                                                        <Lightbulb className="w-3.5 h-3.5" /> How I Got This Internship
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">{exp.how_got_internship}</p>
                                                </div>
                                            )}

                                            {/* Selection rounds */}
                                            {exp.selection_rounds?.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                        <TrendingUp className="w-3.5 h-3.5" /> Selection Process
                                                    </h4>
                                                    <div className="space-y-1.5">
                                                        {exp.selection_rounds.map((round, idx) => (
                                                            <div key={idx} className="flex gap-2 items-start text-sm">
                                                                <span className="text-xs font-medium text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                                                    {idx + 1}
                                                                </span>
                                                                <div>
                                                                    <span className="font-medium">{round.name}</span>
                                                                    {round.description && (
                                                                        <p className="text-xs text-muted-foreground">{round.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Industry experience */}
                                            {exp.industry_experience && (
                                                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                                                    <h4 className="text-xs font-semibold text-violet-500 mb-1 flex items-center gap-1">
                                                        <BookOpen className="w-3.5 h-3.5" /> Hands-on Experience
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">{exp.industry_experience}</p>
                                                </div>
                                            )}

                                            {/* Tips */}
                                            {exp.tips_for_applicants && (
                                                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                                                    <h4 className="text-xs font-semibold text-yellow-500 mb-1 flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5" /> Tips for Applicants
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">{exp.tips_for_applicants}</p>
                                                </div>
                                            )}

                                            <p className="text-xs text-muted-foreground text-right">
                                                Shared {new Date(exp.created_at).toLocaleDateString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── Apply Dialog ──────────────────────────────────────── */}
            <Dialog open={!!applyDialog} onOpenChange={() => setApplyDialog(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Apply — {applyDialog?.company_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">{applyDialog?.role}</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                {applyDialog?.location && <span><MapPin className="w-3 h-3 inline mr-0.5" />{applyDialog.location}</span>}
                                {applyDialog?.stipend && <span><IndianRupee className="w-3 h-3 inline mr-0.5" />{applyDialog.stipend}</span>}
                                {applyDialog?.duration && <span><Clock className="w-3 h-3 inline mr-0.5" />{applyDialog.duration}</span>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Cover Letter <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Textarea
                                value={coverLetter}
                                onChange={e => setCoverLetter(e.target.value)}
                                placeholder="Tell us why you're interested in this internship, your relevant skills and what you hope to learn..."
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
                        <Button onClick={handleApply} disabled={applying}>
                            {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Send className="w-4 h-4 mr-2" /> Submit Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Share Experience Dialog ───────────────────────────── */}
            <Dialog open={shareDialog} onOpenChange={setShareDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Share Your Internship Story</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Company Name *</Label>
                                <Input
                                    value={shareForm.company_name}
                                    onChange={e => setShareForm(p => ({ ...p, company_name: e.target.value }))}
                                    placeholder="e.g. Google, TCS"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Role *</Label>
                                <Input
                                    value={shareForm.role}
                                    onChange={e => setShareForm(p => ({ ...p, role: e.target.value }))}
                                    placeholder="e.g. SDE Intern"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Duration</Label>
                                <Input
                                    value={shareForm.duration}
                                    onChange={e => setShareForm(p => ({ ...p, duration: e.target.value }))}
                                    placeholder="e.g. 2 months"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Stipend (approx)</Label>
                                <Input
                                    value={shareForm.stipend}
                                    onChange={e => setShareForm(p => ({ ...p, stipend: e.target.value }))}
                                    placeholder="e.g. ₹20,000/month"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Start Date</Label>
                                <Input type="date" value={shareForm.start_date}
                                    onChange={e => setShareForm(p => ({ ...p, start_date: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Date</Label>
                                <Input type="date" value={shareForm.end_date}
                                    onChange={e => setShareForm(p => ({ ...p, end_date: e.target.value }))}
                                    disabled={shareForm.is_currently_interning} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="currently_interning"
                                checked={shareForm.is_currently_interning}
                                onChange={e => setShareForm(p => ({ ...p, is_currently_interning: e.target.checked, end_date: e.target.checked ? "" : p.end_date }))}
                                className="rounded"
                            />
                            <Label htmlFor="currently_interning">I am currently interning here</Label>
                        </div>

                        <div className="space-y-1.5">
                            <Label>How did you get this internship?</Label>
                            <Textarea
                                value={shareForm.how_got_internship}
                                onChange={e => setShareForm(p => ({ ...p, how_got_internship: e.target.value }))}
                                placeholder="Describe your journey — campus drive, referral, LinkedIn, direct apply, etc."
                                rows={3}
                            />
                        </div>

                        {/* Selection rounds */}
                        <div className="space-y-2">
                            <Label>Selection Rounds You Faced</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={roundInput.name}
                                    onChange={e => setRoundInput(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Round name (e.g. Coding Test)"
                                />
                                <Input
                                    value={roundInput.description}
                                    onChange={e => setRoundInput(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Your experience in this round"
                                />
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addShareRound}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Round
                            </Button>
                            {shareForm.selection_rounds.length > 0 && (
                                <div className="space-y-1.5">
                                    {shareForm.selection_rounds.map((r, idx) => (
                                        <div key={idx} className="flex items-start justify-between p-2 rounded-md bg-muted/40 text-sm gap-2">
                                            <div>
                                                <span className="font-medium">Round {idx + 1}: {r.name}</span>
                                                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                                            </div>
                                            <Button
                                                variant="ghost" size="sm"
                                                onClick={() => setShareForm(p => ({ ...p, selection_rounds: p.selection_rounds.filter((_, i) => i !== idx) }))}
                                                className="h-6 w-6 p-0 text-destructive"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Industry Hands-on Experience</Label>
                            <Textarea
                                value={shareForm.industry_experience}
                                onChange={e => setShareForm(p => ({ ...p, industry_experience: e.target.value }))}
                                placeholder="What did you work on? What skills did you gain? How was the work culture?"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tips for Future Applicants</Label>
                            <Textarea
                                value={shareForm.tips_for_applicants}
                                onChange={e => setShareForm(p => ({ ...p, tips_for_applicants: e.target.value }))}
                                placeholder="Any advice on preparation, interviews, skills to build, etc."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Overall Rating</Label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setShareForm(p => ({ ...p, rating: n }))}
                                    >
                                        <Star className={`w-6 h-6 transition-colors ${
                                            n <= shareForm.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30"
                                        }`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialog(false)}>Cancel</Button>
                        <Button onClick={handleShareExperience} disabled={sharing}>
                            {sharing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Share Story
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
