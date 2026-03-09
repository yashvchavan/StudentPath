"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Briefcase,
    Plus,
    Pencil,
    Trash2,
    Users,
    MapPin,
    Calendar,
    IndianRupee,
    Clock,
    Eye,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Round {
    name: string;
    description: string;
}

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
    is_active: boolean;
    application_count: number;
    created_at: string;
}

interface Application {
    application_id: number;
    student_id: number;
    student_name: string;
    email: string;
    program: string;
    current_year: number;
    current_gpa?: number;
    status: "applied" | "under_review" | "shortlisted" | "rejected" | "selected";
    cover_letter?: string;
    applied_at: string;
}

const STATUS_COLORS: Record<string, string> = {
    applied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    under_review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    shortlisted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    selected: "bg-green-500/10 text-green-500 border-green-500/20",
};

const EMPTY_FORM = {
    company_name: "",
    logo_url: "",
    role: "",
    stipend: "",
    duration: "",
    description: "",
    eligibility: "",
    location: "",
    type: "in-office" as "remote" | "in-office" | "hybrid",
    start_date: "",
    application_deadline: "",
    apply_process: "",
    rounds: [] as Round[],
    required_skills: [] as string[],
    perks: "",
    is_active: true,
};

export default function AdminInternshipsPage() {
    const { toast } = useToast();

    const [internships, setInternships] = useState<Internship[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    // Round builder
    const [roundInput, setRoundInput] = useState({ name: "", description: "" });
    // Skill builder
    const [skillInput, setSkillInput] = useState("");

    // Applicants view
    const [viewApplicationsFor, setViewApplicationsFor] = useState<Internship | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);

    useEffect(() => {
        fetchInternships();
    }, []);

    const fetchInternships = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/internships");
            const data = await res.json();
            if (data.success) setInternships(data.data);
        } catch {
            toast({ title: "Error", description: "Failed to load internships", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setRoundInput({ name: "", description: "" });
        setSkillInput("");
        setFormOpen(true);
    };

    const openEditForm = (internship: Internship) => {
        setEditingId(internship.id);
        setForm({
            company_name: internship.company_name,
            logo_url: internship.logo_url || "",
            role: internship.role,
            stipend: internship.stipend || "",
            duration: internship.duration || "",
            description: internship.description || "",
            eligibility: internship.eligibility || "",
            location: internship.location || "",
            type: internship.type,
            start_date: internship.start_date?.split("T")[0] || "",
            application_deadline: internship.application_deadline?.split("T")[0] || "",
            apply_process: internship.apply_process || "",
            rounds: internship.rounds || [],
            required_skills: internship.required_skills || [],
            perks: internship.perks || "",
            is_active: internship.is_active,
        });
        setRoundInput({ name: "", description: "" });
        setSkillInput("");
        setFormOpen(true);
    };

    const addRound = () => {
        if (!roundInput.name.trim()) return;
        setForm(prev => ({
            ...prev,
            rounds: [...prev.rounds, { name: roundInput.name.trim(), description: roundInput.description.trim() }],
        }));
        setRoundInput({ name: "", description: "" });
    };

    const removeRound = (idx: number) => {
        setForm(prev => ({ ...prev, rounds: prev.rounds.filter((_, i) => i !== idx) }));
    };

    const addSkill = () => {
        const s = skillInput.trim();
        if (!s || form.required_skills.includes(s)) return;
        setForm(prev => ({ ...prev, required_skills: [...prev.required_skills, s] }));
        setSkillInput("");
    };

    const removeSkill = (s: string) => {
        setForm(prev => ({ ...prev, required_skills: prev.required_skills.filter(x => x !== s) }));
    };

    const handleSave = async () => {
        if (!form.company_name.trim() || !form.role.trim()) {
            toast({ title: "Validation", description: "Company name and role are required", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                start_date: form.start_date || null,
                application_deadline: form.application_deadline || null,
                logo_url: form.logo_url || null,
            };

            const url = editingId ? `/api/admin/internships/${editingId}` : "/api/admin/internships";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: "Success", description: editingId ? "Internship updated" : "Internship posted" });
                setFormOpen(false);
                fetchInternships();
            } else {
                toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this internship? All applications will also be removed.")) return;
        try {
            const res = await fetch(`/api/admin/internships/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Deleted", description: "Internship removed" });
                setInternships(prev => prev.filter(i => i.id !== id));
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    const handleToggleActive = async (internship: Internship) => {
        try {
            const res = await fetch(`/api/admin/internships/${internship.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !internship.is_active }),
            });
            const data = await res.json();
            if (data.success) {
                setInternships(prev =>
                    prev.map(i => i.id === internship.id ? { ...i, is_active: !i.is_active } : i)
                );
            }
        } catch {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const fetchApplications = async (internship: Internship) => {
        setViewApplicationsFor(internship);
        setApplicationsLoading(true);
        try {
            const res = await fetch(`/api/admin/internships/${internship.id}`);
            const data = await res.json();
            if (data.success) setApplications(data.data);
        } catch {
            toast({ title: "Error", description: "Failed to fetch applications", variant: "destructive" });
        } finally {
            setApplicationsLoading(false);
        }
    };

    const updateAppStatus = async (internshipId: number, appId: number, status: string) => {
        try {
            const res = await fetch(`/api/admin/internships/${internshipId}/applications/${appId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                setApplications(prev =>
                    prev.map(a => a.application_id === appId ? { ...a, status: status as any } : a)
                );
                toast({ title: "Updated", description: `Status set to ${status}` });
            }
        } catch {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <AdminShell title="Internship Management" description="Post and manage internship opportunities for your students">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-primary" />
                        <div>
                            <h2 className="text-lg font-semibold">Internship Opportunities</h2>
                            <p className="text-sm text-muted-foreground">{internships.length} total internships posted</p>
                        </div>
                    </div>
                    <Button onClick={openCreateForm} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Post Internship
                    </Button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold">{internships.length}</p>
                            <p className="text-xs text-muted-foreground">Total Posted</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-green-500">{internships.filter(i => i.is_active).length}</p>
                            <p className="text-xs text-muted-foreground">Active</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-blue-500">
                                {internships.reduce((sum, i) => sum + (i.application_count || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Applications</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-purple-500">
                                {new Set(internships.map(i => i.company_name)).size}
                            </p>
                            <p className="text-xs text-muted-foreground">Companies</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Internship list */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : internships.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No internships posted yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Click "Post Internship" to add your first one</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {internships.map(internship => (
                            <Card key={internship.id} className={!internship.is_active ? "opacity-60" : ""}>
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-base">{internship.company_name}</h3>
                                            <p className="text-sm text-muted-foreground">{internship.role}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline" className={internship.is_active ? "text-green-500 border-green-500/30" : "text-gray-500"}>
                                                {internship.is_active ? "Active" : "Closed"}
                                            </Badge>
                                        </div>
                                    </div>

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
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {internship.required_skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {internship.required_skills.slice(0, 4).map(skill => (
                                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                            ))}
                                            {internship.required_skills.length > 4 && (
                                                <Badge variant="secondary" className="text-xs">+{internship.required_skills.length - 4}</Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                        <button
                                            onClick={() => fetchApplications(internship)}
                                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            {internship.application_count || 0} applications
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(internship)}
                                                className="text-xs h-7"
                                            >
                                                {internship.is_active ? (
                                                    <><XCircle className="w-3.5 h-3.5 mr-1 text-orange-500" /> Close</>
                                                ) : (
                                                    <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" /> Reopen</>
                                                )}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => openEditForm(internship)} className="h-7">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(internship.id)} className="h-7 text-destructive hover:text-destructive">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create/Edit Dialog ──────────────────────────────── */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Internship" : "Post New Internship"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Company Name *</Label>
                                <Input
                                    value={form.company_name}
                                    onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                                    placeholder="e.g. Google, TCS, Infosys"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Role / Position *</Label>
                                <Input
                                    value={form.role}
                                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                                    placeholder="e.g. Software Engineering Intern"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Stipend</Label>
                                <Input
                                    value={form.stipend}
                                    onChange={e => setForm(p => ({ ...p, stipend: e.target.value }))}
                                    placeholder="e.g. ₹15,000/month"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Duration</Label>
                                <Input
                                    value={form.duration}
                                    onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                                    placeholder="e.g. 2 months, 6 weeks"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Location</Label>
                                <Input
                                    value={form.location}
                                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                    placeholder="e.g. Bangalore, Mumbai"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Work Type</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={v => setForm(p => ({ ...p, type: v as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in-office">In-Office</SelectItem>
                                        <SelectItem value="remote">Remote</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={form.start_date}
                                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Application Deadline</Label>
                                <Input
                                    type="date"
                                    value={form.application_deadline}
                                    onChange={e => setForm(p => ({ ...p, application_deadline: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Eligibility Criteria</Label>
                            <Input
                                value={form.eligibility}
                                onChange={e => setForm(p => ({ ...p, eligibility: e.target.value }))}
                                placeholder="e.g. Computer Science, IT — 7.0+ CGPA"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Describe the internship role, responsibilities..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Application / Selection Process</Label>
                            <Textarea
                                value={form.apply_process}
                                onChange={e => setForm(p => ({ ...p, apply_process: e.target.value }))}
                                placeholder="Describe how students should apply and what the process looks like..."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Perks & Benefits</Label>
                            <Input
                                value={form.perks}
                                onChange={e => setForm(p => ({ ...p, perks: e.target.value }))}
                                placeholder="e.g. PPO opportunity, certificate, free meals"
                            />
                        </div>

                        {/* Required Skills */}
                        <div className="space-y-2">
                            <Label>Required Skills</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                    placeholder="Add skill and press Enter"
                                />
                                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {form.required_skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="flex items-center gap-1 pr-1">
                                        {skill}
                                        <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Selection Rounds */}
                        <div className="space-y-2">
                            <Label>Selection Rounds</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={roundInput.name}
                                    onChange={e => setRoundInput(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Round name (e.g. Aptitude Test)"
                                />
                                <Input
                                    value={roundInput.description}
                                    onChange={e => setRoundInput(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Brief description"
                                />
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addRound}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Round
                            </Button>
                            {form.rounds.length > 0 && (
                                <div className="space-y-1.5">
                                    {form.rounds.map((round, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-sm">
                                            <div>
                                                <span className="font-medium">Round {idx + 1}: {round.name}</span>
                                                {round.description && <p className="text-xs text-muted-foreground">{round.description}</p>}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeRound(idx)} className="h-6 w-6 p-0 text-destructive">
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                                className="rounded"
                            />
                            <Label htmlFor="is_active">Active (visible to students)</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingId ? "Update" : "Post Internship"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Applications Dialog ──────────────────────────────── */}
            <Dialog open={!!viewApplicationsFor} onOpenChange={() => setViewApplicationsFor(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Applications — {viewApplicationsFor?.company_name} ({viewApplicationsFor?.role})
                        </DialogTitle>
                    </DialogHeader>

                    {applicationsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : applications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No applications yet</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Program / Year</TableHead>
                                    <TableHead>GPA</TableHead>
                                    <TableHead>Applied</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.application_id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{app.student_name}</p>
                                                <p className="text-xs text-muted-foreground">{app.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {app.program}<br />
                                            <span className="text-muted-foreground">Year {app.current_year}</span>
                                        </TableCell>
                                        <TableCell>{app.current_gpa ?? "—"}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(app.applied_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={STATUS_COLORS[app.status]}>
                                                {app.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={app.status}
                                                onValueChange={v =>
                                                    updateAppStatus(viewApplicationsFor!.id, app.application_id, v)
                                                }
                                            >
                                                <SelectTrigger className="h-7 text-xs w-36">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="applied">Applied</SelectItem>
                                                    <SelectItem value="under_review">Under Review</SelectItem>
                                                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                    <SelectItem value="selected">Selected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>
        </AdminShell>
    );
}
