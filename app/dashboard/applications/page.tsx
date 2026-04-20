"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Edit2, Trash2, ExternalLink, Building2,
  Calendar, ChevronDown, X, CheckCircle2, AlertCircle, Loader2,
  MapPin, FileText, Briefcase, GraduationCap, Zap, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = "saved" | "applied" | "screening" | "interview" | "offer" | "rejected";

interface Application {
  id: number;
  job_id: number | null;
  job_title: string;
  company: string;
  apply_url: string | null;
  logo_url: string | null;
  location: string | null;
  salary_range: string | null;
  status: AppStatus;
  applied_date: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number; saved: number; applied: number;
  screening: number; interview: number; offer: number; rejected: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string }> = {
  saved:     { label: "Saved",      color: "text-slate-600",   bg: "bg-slate-100 dark:bg-slate-800" },
  applied:   { label: "Applied",    color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/30" },
  screening: { label: "Screening",  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/30" },
  interview: { label: "Interview",  color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-900/30" },
  offer:     { label: "Offer 🎉",   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  rejected:  { label: "Rejected",   color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/30" },
};

const ALL_STATUSES: AppStatus[] = ["saved", "applied", "screening", "interview", "offer", "rejected"];

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function AppModal({
  app, onClose, onSave,
}: {
  app: Application | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    job_title: app?.job_title || "",
    company: app?.company || "",
    apply_url: app?.apply_url || "",
    location: app?.location || "",
    salary_range: app?.salary_range || "",
    status: app?.status || "applied" as AppStatus,
    applied_date: app?.applied_date?.split("T")[0] || new Date().toISOString().split("T")[0],
    notes: app?.notes || "",
    contact_name: app?.contact_name || "",
    contact_email: app?.contact_email || "",
    next_action: app?.next_action || "",
    next_action_date: app?.next_action_date?.split("T")[0] || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.job_title || !form.company) { setError("Job title and company are required"); return; }
    setSaving(true);
    setError("");
    try {
      const method = app ? "PATCH" : "POST";
      const body = app ? { id: app.id, ...form } : form;
      const res = await fetch("/api/applications", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave();
      onClose();
    } catch {
      setError("Failed to save application. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">{app ? "Edit Application" : "Add Application"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Job Title *</label>
              <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="Software Engineer" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Company *</label>
              <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Google" className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Job URL</label>
            <Input value={form.apply_url} onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))} placeholder="https://..." className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Remote / Bangalore" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Salary / Stipend</label>
              <Input value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))} placeholder="₹15,000/mo" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as AppStatus }))}
                className="w-full h-9 rounded-md border border-input bg-background text-sm px-3"
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Applied Date</label>
              <Input type="date" value={form.applied_date} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Name</label>
              <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Recruiter name" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
              <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="hr@company.com" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Next Action</label>
              <Input value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder="Follow up / Interview" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Action Date</label>
              <Input type="date" value={form.next_action_date} onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any notes about this application..."
              rows={3}
              className="w-full rounded-md border border-input bg-background text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} size="sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            {app ? "Update" : "Add Application"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Row ──────────────────────────────────────────────────────────
function AppRow({
  app, onEdit, onDelete, onStatusChange,
}: {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: AppStatus) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const cfg = STATUS_CONFIG[app.status];

  const isOverdue = app.next_action_date &&
    new Date(app.next_action_date) < new Date() &&
    app.status !== "offer" && app.status !== "rejected";

  return (
    <div className="flex items-center gap-3 p-3.5 border border-border/60 rounded-xl bg-card hover:border-primary/20 transition-all group">
      {/* Company logo */}
      <div className="w-9 h-9 rounded-lg border border-border/60 flex items-center justify-center bg-muted/30 flex-shrink-0">
        {app.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.logo_url} alt={app.company} className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <Building2 className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{app.job_title}</p>
          <span className="text-xs text-muted-foreground">at {app.company}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {app.location && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {app.location}
            </span>
          )}
          {app.applied_date && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(app.applied_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
          {app.next_action && (
            <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
              {app.next_action}
              {app.next_action_date && ` — ${new Date(app.next_action_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
            </span>
          )}
        </div>
        {app.notes && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs">
            <FileText className="w-3 h-3 inline mr-0.5" /> {app.notes}
          </p>
        )}
      </div>

      {/* Status dropdown */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${cfg.bg} ${cfg.color} border border-transparent hover:border-current/20 transition-colors`}
        >
          {cfg.label}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showStatusMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border rounded-xl shadow-xl overflow-hidden w-36">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(app.id, s); setShowStatusMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    app.status === s ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} font-medium` : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {app.apply_url && (
          <a href={app.apply_url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={() => onEdit(app)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(app.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.success) { setApps(data.data); setStats(data.stats); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id: number, status: AppStatus) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      showToast("success", `Moved to ${STATUS_CONFIG[status].label}`);
      fetchApps(); // Refresh stats
    } catch { showToast("error", "Failed to update status"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this application?")) return;
    setApps(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
      showToast("success", "Deleted");
      fetchApps();
    } catch { showToast("error", "Failed to delete"); }
  };

  const filtered = activeStatus === "all"
    ? apps
    : apps.filter(a => a.status === activeStatus);

  return (
    <DashboardLayout currentPage="applications">
      <div className="space-y-5 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Applications</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track every internship and job application in one place
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(["applied", "screening", "interview", "offer", "rejected"] as AppStatus[]).map(s => {
              const count = stats[s as keyof Stats] as number;
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className={`rounded-xl p-3 text-center border ${activeStatus === s ? "border-primary bg-primary/5" : "border-border/60 bg-card"}`}>
                  <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                </div>
              );
            })}
            <div className={`rounded-xl p-3 text-center border ${activeStatus === "all" ? "border-primary bg-primary/5" : "border-border/60 bg-card"}`}>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveStatus("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeStatus === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({apps.length})
          </button>
          {ALL_STATUSES.map(s => {
            const count = apps.filter(a => a.status === s).length;
            if (count === 0 && activeStatus !== s) return null;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {STATUS_CONFIG[s].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Applications list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border/60 rounded-xl">
            <Briefcase className="w-10 h-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No applications yet</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Add manually or apply to jobs from the{" "}
                <a href="/dashboard/jobs" className="text-primary hover:underline">Job Board</a>
              </p>
            </div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Add Your First Application
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => (
              <AppRow
                key={app.id}
                app={app}
                onEdit={setEditApp}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showAdd || editApp) && (
        <AppModal
          app={editApp}
          onClose={() => { setShowAdd(false); setEditApp(null); }}
          onSave={fetchApps}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2 ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </DashboardLayout>
  );
}
