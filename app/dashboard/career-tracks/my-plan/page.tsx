"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
    RadarChart, PolarGrid, PolarAngleAxis,
    Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import {
    Zap, Flame, Trophy, Target, CheckCircle2, Circle,
    ArrowLeft, Star, BookOpen, TrendingUp, Medal,
    Sparkles, Sun, Moon, RefreshCw, Trash2, AlertTriangle, X,
    Plus, Calendar, GraduationCap, Building2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CareerPlan {
    id: number;
    target_id: string;
    target_name: string;
    track_type: string;
    total_xp: number;
    current_streak: number;
    progress: number;
    difficulty_level: "easy" | "medium" | "hard";
    created_at: string;
}

interface CareerTask {
    id: number;
    plan_id: number;
    week_number: number;
    task_date: string | null;
    skill_focus: string;
    morning_task: string;
    evening_task: string;
    difficulty: "easy" | "medium" | "hard";
    xp: number;
    is_completed: boolean;
}

interface CareerReward {
    id: number;
    badge_name: string;
    badge_icon: string;
    xp_threshold: number;
    unlocked_at: string;
}

interface RadarData {
    skill: string;
    completion_rate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REWARD_TIERS = [
    { xp: 500, badge: "Beginner Achiever", icon: "🌱" },
    { xp: 1500, badge: "Consistency King", icon: "🔥" },
    { xp: 3000, badge: "Placement Warrior", icon: "⚔️" },
    { xp: 5000, badge: "Elite Candidate", icon: "👑" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    medium: "text-amber-400  bg-amber-400/10  border-amber-400/30",
    hard: "text-rose-400   bg-rose-400/10   border-rose-400/30",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextMilestone(xp: number) {
    return REWARD_TIERS.find(t => t.xp > xp) ?? REWARD_TIERS[REWARD_TIERS.length - 1];
}

function getXpInfo(xp: number) {
    const next = REWARD_TIERS.find(t => t.xp > xp);
    if (!next) return { needed: 0, progress: 100, nextXp: 5000 };
    const prev = [...REWARD_TIERS].reverse().find(t => t.xp <= xp);
    const base = prev?.xp ?? 0;
    const pct = Math.round(((xp - base) / (next.xp - base)) * 100);
    return { needed: next.xp - xp, progress: Math.max(0, Math.min(100, pct)), nextXp: next.xp };
}

/** Compare task_date (YYYY-MM-DD or ISO string) with today in local time */
function isToday(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return dateStr.slice(0, 10) === todayStr;
}

// ─── Sub-task item: morning or evening ────────────────────────────────────────
/**
 * Each DB row has morning_task + evening_task.
 * We treat them as TWO separate completable items.
 * Completing either one calls the same complete-task API (marks the whole row done).
 * Once the row is done, both show as completed.
 */
interface SubTaskProps {
    task: CareerTask;
    slot: "morning" | "evening";
    completing: number | null;
    onComplete: (taskId: number) => void;
    showWeek?: boolean;
}

function SubTaskItem({ task, slot, completing, onComplete, showWeek }: SubTaskProps) {
    const label = slot === "morning" ? task.morning_task : task.evening_task;
    if (!label || label.trim() === "") return null;

    const isDone = task.is_completed;
    const isLoading = completing === task.id;

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 group ${isDone
            ? "border-emerald-500/20 bg-emerald-500/5 opacity-75"
            : "border-border/60 bg-card/50 hover:border-primary/30 hover:bg-muted/30"
            }`}>
            {/* Slot icon */}
            <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${slot === "morning" ? "bg-amber-500/10" : "bg-indigo-500/10"
                }`}>
                {slot === "morning"
                    ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                    : <Moon className="w-3.5 h-3.5 text-indigo-400" />
                }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-xs text-violet-400 border-violet-400/30 bg-violet-400/10">
                        {task.skill_focus}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                        +{task.xp} XP
                    </Badge>
                    {showWeek && (
                        <span className="text-xs text-muted-foreground ml-auto">Week {task.week_number}</span>
                    )}
                </div>
                <p className={`text-sm leading-snug ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {label}
                </p>
            </div>

            {/* Complete button */}
            <button
                disabled={isDone || isLoading}
                onClick={() => !isDone && onComplete(task.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDone
                    ? "text-emerald-500 bg-emerald-500/10 cursor-default"
                    : isLoading
                        ? "text-muted-foreground bg-muted/50 cursor-wait"
                        : "text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 cursor-pointer"
                    }`}
            >
                {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isDone ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Done</>
                ) : (
                    <><Circle className="w-3.5 h-3.5" /> Mark Done</>
                )}
            </button>
        </div>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ planName, onConfirm, onCancel, loading }: {
    planName: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground">Delete Plan?</h3>
                        <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                    </div>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                    Delete your plan for <strong className="text-foreground">{planName}</strong>?
                    All tasks and XP will be removed.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" onClick={onConfirm} disabled={loading}>
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyPlanPage() {
    const router = useRouter();
    const { isLoading: authLoading } = useAuth();

    const [plans, setPlans] = useState<CareerPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [planData, setPlanData] = useState<{
        plan: CareerPlan; tasks: CareerTask[]; rewards: CareerReward[]; radarData: RadarData[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<number | null>(null);
    const [xpFlash, setXpFlash] = useState<number | null>(null);
    const [newRewardToast, setNewRewardToast] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CareerPlan | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));

    // ── Fetch plans ───────────────────────────────────────────────────────────
    const fetchPlans = useCallback(async (keepSelected?: number) => {
        try {
            const res = await fetch("/api/career-tracks/my-plan/list");
            const data = await res.json();
            if (data.success) {
                setPlans(data.data);
                if (data.data.length > 0) {
                    const target = keepSelected ?? data.data[0].id;
                    setSelectedPlanId(prev => prev ?? target);
                }
            }
        } catch (err) {
            console.error("Error fetching plans:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch plan detail ─────────────────────────────────────────────────────
    const fetchPlanDetail = useCallback(async (planId: number) => {
        try {
            const res = await fetch(`/api/career-tracks/my-plan/${planId}`);
            const data = await res.json();
            if (data.success) setPlanData(data.data);
        } catch (err) {
            console.error("Error fetching plan detail:", err);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) fetchPlans();
    }, [authLoading, fetchPlans]);

    useEffect(() => {
        if (selectedPlanId) fetchPlanDetail(selectedPlanId);
    }, [selectedPlanId, fetchPlanDetail]);

    // ── Complete task ─────────────────────────────────────────────────────────
    const handleCompleteTask = async (taskId: number) => {
        if (!selectedPlanId || completing) return;
        setCompleting(taskId);
        try {
            const res = await fetch("/api/career-tracks/my-plan/complete-task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, planId: selectedPlanId }),
            });
            const data = await res.json();
            if (data.success) {
                const task = planData?.tasks.find(t => t.id === taskId);
                if (task) { setXpFlash(task.xp); setTimeout(() => setXpFlash(null), 2500); }
                if (data.data.newRewards?.length > 0) {
                    setNewRewardToast(`${data.data.newRewards[0].badge_icon} ${data.data.newRewards[0].badge_name} unlocked!`);
                    setTimeout(() => setNewRewardToast(null), 4000);
                }
                await fetchPlanDetail(selectedPlanId);
                await fetchPlans(selectedPlanId);
            }
        } catch (err) {
            console.error("Error completing task:", err);
        } finally {
            setCompleting(null);
        }
    };

    // ── Delete plan ───────────────────────────────────────────────────────────
    const handleDeletePlan = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/career-tracks/my-plan/${deleteTarget.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                setPlanData(null);
                setSelectedPlanId(null);
                await fetchPlans();
            }
        } catch (err) {
            console.error("Error deleting plan:", err);
        } finally {
            setDeleting(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const allTasks = planData?.tasks ?? [];
    const todayTasks = allTasks.filter(t => isToday(t.task_date));
    const weekGroups = allTasks.reduce((acc, task) => {
        const w = task.week_number;
        if (!acc[w]) acc[w] = [];
        acc[w].push(task);
        return acc;
    }, {} as Record<number, CareerTask[]>);

    const currentPlan = planData?.plan;
    const xpInfo = currentPlan ? getXpInfo(currentPlan.total_xp) : null;
    const nextMilestone = currentPlan ? getNextMilestone(currentPlan.total_xp) : null;

    // Count today's pending sub-tasks (morning + evening separately)
    const todayPendingCount = todayTasks.reduce((acc, t) => {
        if (t.is_completed) return acc;
        let count = 0;
        if (t.morning_task?.trim()) count++;
        if (t.evening_task?.trim() && t.evening_task !== t.morning_task) count++;
        return acc + count;
    }, 0);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (authLoading || loading) {
        return (
            <DashboardLayout currentPage="career-tracks">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // ── No plans ──────────────────────────────────────────────────────────────
    if (plans.length === 0) {
        return (
            <DashboardLayout currentPage="career-tracks">
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">No Plans Yet</h2>
                        <p className="text-muted-foreground max-w-md">
                            Generate a career preparation plan from the Placement or Higher Studies track,
                            then click <strong>"Add This Plan"</strong> to start tracking your progress here.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/dashboard/career-tracks")} size="lg">
                        <Sparkles className="w-4 h-4 mr-2" /> Browse Career Tracks
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="career-tracks">
            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteModal
                    planName={deleteTarget.target_name}
                    onConfirm={handleDeletePlan}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}

            {/* XP Flash Toast */}
            {xpFlash && (
                <div className="fixed top-6 right-6 z-50 animate-bounce pointer-events-none">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" /> +{xpFlash} XP
                    </div>
                </div>
            )}

            {/* Reward Toast */}
            {newRewardToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-300" /> {newRewardToast}
                    </div>
                </div>
            )}

            <div className="space-y-6 animate-fade-in">
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/career-tracks")} className="hover:bg-muted/80">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Zap className="w-6 h-6 text-primary" /> My Career Plans
                        </h1>
                        <p className="text-sm text-muted-foreground">Track your progress, complete tasks, and earn XP</p>
                    </div>
                </div>

                {/* ── Layout ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                    {/* ── Sidebar ────────────────────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3">
                            Your Plans
                        </p>

                        {plans.map(plan => {
                            const isActive = selectedPlanId === plan.id;
                            const TrackIcon = plan.track_type === "higher-studies" ? GraduationCap : Building2;
                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && setSelectedPlanId(plan.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden cursor-pointer ${isActive
                                        ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 shadow-lg shadow-primary/10"
                                        : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/40"
                                        }`}
                                >
                                    {/* Active indicator strip */}
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-violet-500 rounded-l-2xl" />
                                    )}

                                    <div className="flex items-start justify-between gap-2 pl-1">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-primary/20" : "bg-muted/60"
                                                }`}>
                                                <TrackIcon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                                                    {plan.target_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                                    {plan.track_type === "higher-studies" ? "Higher Studies" : "Placement"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLORS[plan.difficulty_level]}`}>
                                                {plan.difficulty_level}
                                            </Badge>
                                            <button
                                                onClick={e => { e.stopPropagation(); setDeleteTarget(plan); }}
                                                className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete plan"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mt-3 pl-1 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                                                {Math.round(plan.progress)}%
                                            </span>
                                        </div>
                                        <Progress value={plan.progress} className="h-1.5" />
                                    </div>

                                    {/* XP + Streak */}
                                    <div className="flex items-center gap-3 mt-2.5 pl-1">
                                        <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                                            <Zap className="w-3 h-3" /> {plan.total_xp} XP
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-orange-400 font-medium">
                                            <Flame className="w-3 h-3" /> {plan.current_streak}d streak
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add New Plan */}
                        <button
                            onClick={() => router.push("/dashboard/career-tracks")}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm font-medium mt-1"
                        >
                            <Plus className="w-4 h-4" /> Add New Plan
                        </button>
                    </div>

                    {/* ── Main Content ────────────────────────────────────────── */}
                    <div className="lg:col-span-3 space-y-5">
                        {currentPlan ? (
                            <>
                                {/* Stats Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                                        <CardContent className="p-4 text-center">
                                            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                                            <p className="text-2xl font-bold text-amber-400">{currentPlan.total_xp}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Total XP</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                                        <CardContent className="p-4 text-center">
                                            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1.5" />
                                            <p className="text-2xl font-bold text-orange-400">{currentPlan.current_streak}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                                        <CardContent className="p-4 text-center">
                                            <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                                            <p className="text-2xl font-bold text-blue-400">{Math.round(currentPlan.progress)}%</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Complete</p>
                                        </CardContent>
                                    </Card>
                                    <Card className={`border ${DIFFICULTY_COLORS[currentPlan.difficulty_level]}`}>
                                        <CardContent className="p-4 text-center">
                                            <Target className="w-5 h-5 mx-auto mb-1.5" />
                                            <p className="text-2xl font-bold capitalize">{currentPlan.difficulty_level}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Difficulty</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* XP Progress to next milestone */}
                                {xpInfo && nextMilestone && (
                                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-2xl">{nextMilestone.icon}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">Next: {nextMilestone.badge}</p>
                                                        <p className="text-xs text-muted-foreground">{xpInfo.needed} XP to unlock</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-primary">
                                                    {currentPlan.total_xp} / {xpInfo.nextXp}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <Progress value={xpInfo.progress} className="h-2.5" />
                                                <div
                                                    className="absolute top-0 left-0 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                                                    style={{ width: `${xpInfo.progress}%` }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* ── Today's Tasks ──────────────────────────────── */}
                                <Card className="border-amber-500/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <Sun className="w-4 h-4 text-amber-400" />
                                            </div>
                                            Today's Tasks
                                            <Badge
                                                variant="secondary"
                                                className={`ml-auto text-xs ${todayPendingCount === 0
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    }`}
                                            >
                                                {todayPendingCount === 0 ? "✓ All done!" : `${todayPendingCount} pending`}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5">
                                        {todayTasks.length === 0 ? (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                                    <Calendar className="w-7 h-7 text-muted-foreground/50" />
                                                </div>
                                                <p className="text-sm font-medium">No tasks scheduled for today</p>
                                                <p className="text-xs mt-1 text-muted-foreground/70">
                                                    Check the weekly schedule below for upcoming tasks
                                                </p>
                                            </div>
                                        ) : (
                                            todayTasks.map(task => (
                                                <div key={task.id} className="space-y-2">
                                                    {/* Morning task */}
                                                    <SubTaskItem
                                                        task={task}
                                                        slot="morning"
                                                        completing={completing}
                                                        onComplete={handleCompleteTask}
                                                        showWeek
                                                    />
                                                    {/* Evening task — only if different from morning */}
                                                    {task.evening_task?.trim() &&
                                                        task.evening_task !== task.morning_task && (
                                                            <SubTaskItem
                                                                task={task}
                                                                slot="evening"
                                                                completing={completing}
                                                                onComplete={handleCompleteTask}
                                                                showWeek={false}
                                                            />
                                                        )}
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                {/* ── Weekly Schedule ────────────────────────────── */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <BookOpen className="w-4 h-4 text-primary" />
                                            </div>
                                            Weekly Schedule
                                            <span className="ml-auto text-xs text-muted-foreground font-normal">
                                                Click tasks to mark complete
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {Object.entries(weekGroups)
                                            .sort(([a], [b]) => Number(a) - Number(b))
                                            .map(([week, tasks]) => {
                                                const weekNum = Number(week);
                                                const done = tasks.filter(t => t.is_completed).length;
                                                const pct = Math.round((done / tasks.length) * 100);
                                                const isExpanded = expandedWeeks.has(weekNum);

                                                return (
                                                    <div key={week} className="border border-border/50 rounded-2xl overflow-hidden">
                                                        {/* Week header — clickable to expand */}
                                                        <button
                                                            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
                                                            onClick={() => setExpandedWeeks(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(weekNum)) next.delete(weekNum);
                                                                else next.add(weekNum);
                                                                return next;
                                                            })}
                                                        >
                                                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                                {week}
                                                            </span>
                                                            <span className="text-sm font-semibold text-foreground flex-1">
                                                                Week {week}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">{done}/{tasks.length}</span>
                                                                {pct === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                                <div className="w-20 hidden sm:block">
                                                                    <Progress value={pct} className="h-1.5" />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                                                            </div>
                                                        </button>

                                                        {/* Expanded task list */}
                                                        {isExpanded && (
                                                            <div className="border-t border-border/40 p-3 space-y-2 bg-muted/10">
                                                                {tasks.map(task => (
                                                                    <div key={task.id} className="space-y-2">
                                                                        <SubTaskItem
                                                                            task={task}
                                                                            slot="morning"
                                                                            completing={completing}
                                                                            onComplete={handleCompleteTask}
                                                                        />
                                                                        {task.evening_task?.trim() &&
                                                                            task.evening_task !== task.morning_task && (
                                                                                <SubTaskItem
                                                                                    task={task}
                                                                                    slot="evening"
                                                                                    completing={completing}
                                                                                    onComplete={handleCompleteTask}
                                                                                />
                                                                            )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </CardContent>
                                </Card>

                                {/* ── Skill Radar ────────────────────────────────── */}
                                {planData?.radarData && planData.radarData.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                                    <Star className="w-4 h-4 text-violet-400" />
                                                </div>
                                                Skill Progress Radar
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <RadarChart data={planData.radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                                    <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                                                    <Radar
                                                        name="Completion %"
                                                        dataKey="completion_rate"
                                                        stroke="#8b5cf6"
                                                        fill="#8b5cf6"
                                                        fillOpacity={0.3}
                                                        strokeWidth={2}
                                                        dot={{ fill: "#8b5cf6", r: 4 }}
                                                    />
                                                    <Tooltip
                                                        formatter={(val: any) => [`${val}%`, "Completion"]}
                                                        contentStyle={{
                                                            background: "#1e293b",
                                                            border: "1px solid rgba(139,92,246,0.3)",
                                                            borderRadius: "10px",
                                                            color: "#e2e8f0",
                                                            fontSize: "13px",
                                                        }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {planData.radarData.map(d => (
                                                    <div key={d.skill} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-muted/30">
                                                        <span className="text-muted-foreground truncate">{d.skill}</span>
                                                        <span className="font-bold text-violet-400 ml-2 shrink-0">{d.completion_rate}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* ── Achievement Badges ─────────────────────────── */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                                <Medal className="w-4 h-4 text-yellow-400" />
                                            </div>
                                            Achievement Badges
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {REWARD_TIERS.map(tier => {
                                                const unlocked = planData?.rewards.some(r => r.badge_name === tier.badge);
                                                return (
                                                    <div
                                                        key={tier.badge}
                                                        className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all ${unlocked
                                                            ? "border-yellow-500/40 bg-gradient-to-b from-yellow-500/15 to-yellow-500/5 shadow-lg shadow-yellow-500/10"
                                                            : "border-border/40 bg-muted/10 opacity-40 grayscale"
                                                            }`}
                                                    >
                                                        <span className="text-3xl mb-2">{tier.icon}</span>
                                                        <p className="text-xs font-semibold text-foreground leading-tight">{tier.badge}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{tier.xp} XP</p>
                                                        {unlocked && (
                                                            <Badge className="mt-2 text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                                                ✓ Unlocked
                                                            </Badge>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
