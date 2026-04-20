"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, X, Edit2, Trash2, ExternalLink, Building2,
  Calendar, Loader2, CheckCircle2, AlertCircle,
  User, Mail, Zap, FileText, GripVertical,
  ChevronDown, TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  interview_rounds: any[];
  status_history: any[];
  updated_at: string;
}

interface Stats {
  total: number; applied: number; screening: number;
  interview: number; offer: number; rejected: number;
}

// ─── Column Config ─────────────────────────────────────────────────────────────
const COLUMNS: { status: AppStatus; label: string; color: string; accent: string }[] = [
  { status: "saved",     label: "Saved",     color: "text-slate-600 dark:text-slate-400",   accent: "border-slate-300 dark:border-slate-600" },
  { status: "applied",   label: "Applied",   color: "text-blue-600 dark:text-blue-400",     accent: "border-blue-300 dark:border-blue-600" },
  { status: "screening", label: "Screening", color: "text-yellow-600 dark:text-yellow-400",   accent: "border-yellow-300 dark:border-yellow-600" },
  { status: "interview", label: "Interview", color: "text-violet-600 dark:text-violet-400", accent: "border-violet-300 dark:border-violet-600" },
  { status: "offer",     label: "Offer 🎉",  color: "text-emerald-600 dark:text-emerald-400",accent: "border-emerald-300 dark:border-emerald-600" },
  { status: "rejected",  label: "Rejected",  color: "text-red-500",                          accent: "border-red-300 dark:border-red-600" },
];

const STATUS_BG: Record<AppStatus, string> = {
  saved: "bg-slate-500/10 dark:bg-slate-500/10",
  applied: "bg-blue-500/10 dark:bg-blue-500/10",
  screening: "bg-yellow-500/10 dark:bg-yellow-500/10",
  interview: "bg-violet-500/10 dark:bg-violet-500/10",
  offer: "bg-emerald-500/10 dark:bg-emerald-500/10",
  rejected: "bg-red-500/10 dark:bg-red-500/10",
};

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function AppModal({ app, onClose, onSave }: { app: Application | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    job_title: app?.job_title || "", company: app?.company || "",
    apply_url: app?.apply_url || "", location: app?.location || "",
    salary_range: app?.salary_range || "",
    status: (app?.status || "applied") as AppStatus,
    applied_date: app?.applied_date?.split("T")[0] || new Date().toISOString().split("T")[0],
    notes: app?.notes || "", contact_name: app?.contact_name || "",
    contact_email: app?.contact_email || "", next_action: app?.next_action || "",
    next_action_date: app?.next_action_date?.split("T")[0] || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.job_title || !form.company) { setErr("Job title and company required"); return; }
    setSaving(true);
    try {
      const method = app ? "PATCH" : "POST";
      const body = app ? { id: app.id, ...form } : form;
      const res = await fetch("/api/applications", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      onSave(); onClose();
    } catch { setErr("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-zinc-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">{app ? "Edit Application" : "Add Application"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Job Title *</label>
              <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} className="h-9 text-sm" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Company *</label>
              <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="h-9 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Job URL</label>
            <Input value={form.apply_url} onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))} placeholder="https://..." className="h-9 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Location</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-9 text-sm" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Salary Range</label>
              <Input value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))} placeholder="₹20–25 LPA" className="h-9 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AppStatus }))}
                className="w-full h-9 rounded-md border border-white/5 bg-zinc-950 text-sm px-3">
                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Applied Date</label>
              <Input type="date" value={form.applied_date} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} className="h-9 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Contact Person</label>
              <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Recruiter name" className="h-9 text-sm" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Contact Email</label>
              <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="hr@co.com" className="h-9 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Next Action</label>
              <Input value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder="Follow up..." className="h-9 text-sm" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Action Date</label>
              <Input type="date" value={form.next_action_date} onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))} className="h-9 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Interview notes, contacts, observations..."
              className="w-full rounded-md border border-white/5 bg-zinc-950 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            {app ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({
  app, onEdit, onDelete, isDragging,
  onDragStart, onDragEnd,
}: {
  app: Application;
  onEdit: (a: Application) => void;
  onDelete: (id: number) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, app: Application) => void;
  onDragEnd: () => void;
}) {
  const isOverdue = app.next_action_date &&
    new Date(app.next_action_date) < new Date() &&
    app.status !== "offer" && app.status !== "rejected";

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, app)}
      onDragEnd={onDragEnd}
      className={`bg-zinc-900/40 backdrop-blur-md border rounded-xl p-4 cursor-grab active:cursor-grabbing group transition-all duration-300 shadow-md hover:shadow-xl ${
        isDragging ? "opacity-50 rotate-3 scale-95" : "border-white/10 hover:border-white/30 hover:-translate-y-1"
      }`}
    >
      {/* Drag handle + Company */}
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-3 h-3 text-gray-400/30 group-hover:text-gray-400/70 flex-shrink-0" />
        <div className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
          {app.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.logo_url} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
          ) : (
            <Building2 className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight tracking-wide">{app.job_title}</p>
          <p className="text-[11px] text-gray-400 truncate tracking-wider uppercase font-semibold mt-0.5">{app.company}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(app)} className="p-1 rounded hover:bg-muted text-gray-400 hover:text-primary transition-colors">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(app.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Meta info */}
      <div className="space-y-1">
        {app.salary_range && (
          <p className="text-[10px] text-emerald-600 font-medium">{app.salary_range}</p>
        )}
        {app.applied_date && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Applied {new Date(app.applied_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        )}
        {app.contact_name && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <User className="w-3 h-3" /> {app.contact_name}
          </p>
        )}
        {app.next_action && (
          <p className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {app.next_action}
            {app.next_action_date && ` · ${new Date(app.next_action_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
          </p>
        )}
        {app.notes && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{app.notes}</span>
          </p>
        )}
      </div>

      {/* Apply link */}
      {app.apply_url && (
        <a href={app.apply_url} target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1 text-[10px] text-primary hover:underline">
          <ExternalLink className="w-3 h-3" /> View Job
        </a>
      )}
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────
function KanbanColumn({
  col, apps, dragOverStatus, onDragOver, onDrop,
  onEdit, onDelete, onDragStart, onDragEnd, draggingId,
  onAdd,
}: {
  col: typeof COLUMNS[0];
  apps: Application[];
  dragOverStatus: AppStatus | null;
  onDragOver: (e: React.DragEvent, status: AppStatus) => void;
  onDrop: (e: React.DragEvent, status: AppStatus) => void;
  onEdit: (a: Application) => void;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, app: Application) => void;
  onDragEnd: () => void;
  draggingId: number | null;
  onAdd: (status: AppStatus) => void;
}) {
  const isOver = dragOverStatus === col.status;

  return (
    <div className="flex-1 min-w-[220px] flex flex-col">
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 mb-3 rounded-2xl border bg-zinc-900/40 backdrop-blur-md shadow-sm border-white/5`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-').split(' ')[0]}`} />
          <span className={`text-sm font-bold text-white tracking-wide uppercase`}>{col.label}</span>
          <span className="text-[11px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-full ml-1 border border-white/5">
            {apps.length}
          </span>
        </div>
        <button onClick={() => onAdd(col.status)}
          className="p-1 rounded hover:bg-zinc-950 border-white/5/60 text-gray-400 hover:text-primary transition-colors">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => onDragOver(e, col.status)}
        onDrop={e => onDrop(e, col.status)}
        className={`flex-1 min-h-[400px] space-y-3 rounded-2xl p-2 transition-all duration-300 ${
          isOver ? "bg-white/5 border-2 border-dashed border-white/20 scale-[1.02]" : "border-2 border-dashed border-transparent"
        }`}
      >
        {apps.map(app => (
          <KanbanCard
            key={app.id}
            app={app}
            onEdit={onEdit}
            onDelete={onDelete}
            isDragging={draggingId === app.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {apps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[10px] text-gray-400/50">Drop cards here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfessionalApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [addForStatus, setAddForStatus] = useState<AppStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<AppStatus | null>(null);
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

  // ── Drag and Drop ──────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, app: Application) => {
    setDraggingId(app.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(app.id));
  };

  const handleDragOver = (e: React.DragEvent, status: AppStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: AppStatus) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!id) return;
    setDragOverStatus(null);
    setDraggingId(null);

    const app = apps.find(a => a.id === id);
    if (!app || app.status === newStatus) return;

    // Optimistic update
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));

    try {
      await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      showToast("success", `Moved to ${COLUMNS.find(c => c.status === newStatus)?.label}`);
      fetchApps();
    } catch { fetchApps(); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this application?")) return;
    setApps(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
      showToast("success", "Deleted");
      fetchApps();
    } catch { showToast("error", "Failed"); fetchApps(); }
  };

  const openAdd = (status: AppStatus) => { setAddForStatus(status); setEditApp(null); setShowModal(true); };
  const openEdit = (app: Application) => { setEditApp(app); setAddForStatus(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditApp(null); setAddForStatus(null); };

  // ── Columns data ────────────────────────────────────────────────────────────
  const columnApps = (status: AppStatus) => apps.filter(a => a.status === status);

  // ── Response rate ────────────────────────────────────────────────────────────
  const responseRate = stats
    ? Math.round(((stats.screening + stats.interview + stats.offer) / Math.max(stats.applied, 1)) * 100)
    : 0;

  return (
    <div className="min-h-full p-4 md:p-8 space-y-5 pb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-yellow-500/10 to-yellow-500/10 p-6 rounded-2xl border border-white/5 backdrop-blur-md mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Application Tracker</h1>
          <p className="text-sm text-yellow-400 mt-1 font-medium">Drag and drop cards across the board to update their status</p>
        </div>
        <button onClick={() => openAdd("applied")}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/20 text-sm font-bold px-6 py-3 rounded-xl hover:scale-105 hover:shadow-yellow-500/40 transition-all duration-300">
          <Plus className="w-5 h-5" /> New Application
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 text-center shadow-lg transform hover:-translate-y-1 transition-transform">
            <p className="text-4xl font-black text-white drop-shadow-md">{stats.total}</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Total</p>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 text-center shadow-lg transform hover:-translate-y-1 transition-transform relative overflow-hidden group">
            <div className="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-4xl font-black text-violet-400 drop-shadow-md relative z-10">{stats.interview}</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1 relative z-10">Interviews</p>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 text-center shadow-lg transform hover:-translate-y-1 transition-transform relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-4xl font-black text-emerald-400 drop-shadow-md relative z-10">{stats.offer}</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1 relative z-10">Offers</p>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 text-center shadow-lg transform hover:-translate-y-1 transition-transform relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-4xl font-black text-yellow-400 drop-shadow-md relative z-10">{responseRate}%</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1 relative z-10">Response Rate</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        /* Kanban board — horizontal scroll on mobile */
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "500px" }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.status}
              col={col}
              apps={columnApps(col.status)}
              dragOverStatus={dragOverStatus}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
              draggingId={draggingId}
              onAdd={openAdd}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AppModal
          app={editApp}
          onClose={closeModal}
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
    </div>
  );
}
