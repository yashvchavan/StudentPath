"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, Plus, CheckCircle2, Clock, Trash2, Edit3, X,
  Circle, TrendingUp, Calendar, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
type GoalStatus = "planning" | "in-progress" | "completed" | "paused";
type GoalCategory = "Academic" | "Career" | "Skill" | "Project" | "Other";

interface Goal {
  id: number;
  title: string;
  description: string | null;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  deadline: string | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES: GoalCategory[] = ["Academic", "Career", "Skill", "Project", "Other"];

const STATUS_META: Record<GoalStatus, { label: string; color: string; Icon: React.ElementType }> = {
  planning:    { label: "Planning",    color: "text-zinc-400 border-zinc-600/40 bg-zinc-800/40",     Icon: Circle },
  "in-progress":{ label: "In Progress", color: "text-blue-400 border-blue-600/30 bg-blue-900/20",  Icon: Clock },
  completed:   { label: "Completed",   color: "text-emerald-400 border-emerald-600/30 bg-emerald-900/20", Icon: CheckCircle2 },
  paused:      { label: "Paused",      color: "text-amber-400 border-amber-600/30 bg-amber-900/20", Icon: Circle },
};

// ── Goal Form ──────────────────────────────────────────────────────────────
function GoalForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: Partial<Goal>;
  onSave: (data: Partial<Goal>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState<GoalCategory>(initial?.category || "Other");
  const [deadline, setDeadline] = useState(initial?.deadline || "");

  return (
    <div className="border rounded-xl p-5 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{initial?.id ? "Edit Goal" : "New Goal"}</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <Input
        placeholder="Goal title *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="text-sm"
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="text-sm resize-none"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select value={category} onValueChange={v => setCategory(v as GoalCategory)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="text-sm"
          placeholder="Deadline"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={() => onSave({ title, description, category, deadline })} disabled={saving || !title.trim()}>
          {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
          {initial?.id ? "Save Changes" : "Add Goal"}
        </Button>
      </div>
    </div>
  );
}

// ── Goal Card ──────────────────────────────────────────────────────────────
function GoalCard({
  goal, onEdit, onDelete, onProgressChange, onStatusChange, updating,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (p: number) => void;
  onStatusChange: (s: GoalStatus) => void;
  updating: boolean;
}) {
  const meta = STATUS_META[goal.status];
  const Icon = meta.Icon;

  return (
    <div className="border rounded-xl p-4 bg-card space-y-3 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="text-[10px] font-normal">{goal.category}</Badge>
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${meta.color}`}>
              <Icon className="w-2.5 h-2.5" />
              {meta.label}
            </span>
            {goal.deadline && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(goal.deadline + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <h3 className={`text-sm font-medium ${goal.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{goal.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium text-foreground">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} className="h-1" />
        <input
          type="range"
          min={0} max={100} step={5}
          value={goal.progress}
          disabled={updating}
          onChange={e => onProgressChange(Number(e.target.value))}
          className="w-full accent-foreground h-1 opacity-0 -mt-3 cursor-pointer"
          style={{ marginTop: "-8px" }}
        />
      </div>

      {/* Status picker */}
      <div className="flex gap-1.5 flex-wrap">
        {(["planning", "in-progress", "completed", "paused"] as GoalStatus[]).map(s => (
          <button
            key={s}
            disabled={updating || goal.status === s}
            onClick={() => onStatusChange(s)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              goal.status === s
                ? STATUS_META[s].color + " font-medium"
                : "border-border/40 text-muted-foreground hover:border-border"
            }`}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CareerGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/student/goals", { credentials: "include" });
      const data = await res.json();
      if (data.success) setGoals(data.goals);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (data: Partial<Goal>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/goals", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setGoals(prev => [json.goal, ...prev]);
        setShowForm(false);
      }
    } finally { setSaving(false); }
  };

  const handleEdit = async (data: Partial<Goal>) => {
    if (!editGoal) return;
    setSaving(true);
    try {
      const res = await fetch("/api/student/goals", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editGoal.id, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        setGoals(prev => prev.map(g => g.id === editGoal.id ? json.goal : g));
        setEditGoal(null);
      }
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: number, patch: Partial<Goal>) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/student/goals", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (json.success) {
        setGoals(prev => prev.map(g => g.id === id ? json.goal : g));
      }
    } finally { setUpdatingId(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await fetch(`/api/student/goals?id=${id}`, { method: "DELETE", credentials: "include" });
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e) { console.error(e); }
  };

  // Stats
  const total = goals.length;
  const byStatus = goals.reduce((acc, g) => { acc[g.status] = (acc[g.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const avgProgress = total > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / total) : 0;

  const filtered = filterStatus === "all" ? goals : goals.filter(g => g.status === filterStatus);

  return (
    <DashboardLayout currentPage="goals">
      <div className="space-y-6 pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Career Goals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your academic and career objectives</p>
          </div>
          <Button size="sm" onClick={() => { setShowForm(true); setEditGoal(null); }}
            className="shrink-0 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",       value: total,                  Icon: Target },
            { label: "In Progress", value: byStatus["in-progress"] || 0, Icon: Clock },
            { label: "Completed",   value: byStatus["completed"] || 0,   Icon: CheckCircle2 },
            { label: "Avg Progress",value: `${avgProgress}%`,            Icon: TrendingUp },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="border rounded-xl p-3 bg-card flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && !editGoal && (
          <GoalForm onSave={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {["all", "planning", "in-progress", "completed", "paused"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                filterStatus === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/40 text-muted-foreground hover:border-border"
              }`}
            >
              {s === "all" ? `All (${total})` : `${STATUS_META[s as GoalStatus]?.label} (${byStatus[s] || 0})`}
            </button>
          ))}
        </div>

        {/* Goals list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border rounded-xl p-10 bg-card text-center">
            <Target className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {filterStatus === "all" ? "No goals yet" : `No ${filterStatus} goals`}
            </p>
            <p className="text-xs text-muted-foreground">
              {filterStatus === "all"
                ? "Add your first goal to start tracking your progress."
                : "Try a different filter."}
            </p>
            {filterStatus === "all" && (
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(goal => (
              editGoal?.id === goal.id ? (
                <GoalForm
                  key={goal.id}
                  initial={editGoal}
                  onSave={handleEdit}
                  onCancel={() => setEditGoal(null)}
                  saving={saving}
                />
              ) : (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => { setEditGoal(goal); setShowForm(false); }}
                  onDelete={() => handleDelete(goal.id)}
                  onProgressChange={p => handleUpdate(goal.id, { progress: p, status: p === 100 ? "completed" : p > 0 ? "in-progress" : goal.status })}
                  onStatusChange={s => handleUpdate(goal.id, { status: s, progress: s === "completed" ? 100 : goal.progress })}
                  updating={updatingId === goal.id}
                />
              )
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
