"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, Code, Target, ChevronRight, CheckCircle2, Circle,
  Sun, Moon, Zap, Flame, BookOpen, BarChart3, Award, Building,
  MapPin, Clock, ArrowRight, TrendingUp, Calendar,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface StudentData {
  student_id: string; first_name: string; last_name: string; email: string;
  phone: string; college: string; college_name: string; college_type: string;
  program: string; current_year: number; current_semester: string;
  current_gpa: number; academic_interests: string[];
  technical_skills: Record<string, number>;
  soft_skills: Record<string, number>;
  merged_skills: any[];
  primary_goal: string; secondary_goal: string; timeline: string;
  location_preference: string; industry_focus: string[];
  city: string; state: string; country: string;
}

interface CareerPlan {
  id: number; target_name: string; track_type: string; total_xp: number;
  current_streak: number; progress: number; difficulty_level: string;
}

interface CareerTask {
  id: number; morning_task: string; evening_task: string;
  skill_focus: string; xp: number; is_completed: boolean;
  task_date: string | null; week_number: number;
}

function isToday(d: string | null): boolean {
  if (!d) return false;
  const t = new Date();
  const s = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return d.slice(0, 10) === s;
}

// ── Tiny info row ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground truncate max-w-[60%] text-right">{value || "—"}</span>
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function DashboardContent() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [todayTasks, setTodayTasks] = useState<CareerTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    const load = async () => {
      try {
        // 1. Student data
        const sRes = await fetch(`/api/student/data?studentId=${user.id}`, {
          headers: { "Cache-Control": "no-cache" },
        });
        const sJson = await sRes.json().catch(() => ({}));
        if (sJson.success && sJson.data) {
          setStudent({
            ...sJson.data,
            technical_skills: sJson.data.technical_skills || {},
            soft_skills: sJson.data.soft_skills || {},
            merged_skills: sJson.data.merged_skills || [],
            academic_interests: sJson.data.academic_interests || [],
            industry_focus: sJson.data.industry_focus || [],
          });
        }

        // 2. Career plans list — pick the first
        const pRes = await fetch("/api/career-tracks/my-plan/list");
        const pJson = await pRes.json().catch(() => ({}));
        if (pJson.success && pJson.data?.length > 0) {
          const firstPlan: CareerPlan = pJson.data[0];
          setPlan(firstPlan);

          // 3. Fetch today's tasks for that plan
          const dRes = await fetch(`/api/career-tracks/my-plan/${firstPlan.id}`);
          const dJson = await dRes.json().catch(() => ({}));
          if (dJson.success && dJson.data?.tasks) {
            setTodayTasks((dJson.data.tasks as CareerTask[]).filter(t => isToday(t.task_date)));
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-7 h-7 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) { window.location.href = "/login"; return null; }

  const techEntries = Object.entries(student?.technical_skills || {})
    .filter(([, v]) => typeof v === "number" && isFinite(v as number))
    .sort(([, a], [, b]) => (b as number) - (a as number));

  const gpa = Number(student?.current_gpa || 0);
  const yearPct = Math.round(((student?.current_year || 1) / 4) * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const pendingToday = todayTasks.filter(t => !t.is_completed).length;

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="space-y-8 pb-8">

        {/* ── Greeting ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-xl font-bold text-foreground">
              {student ? `${student.first_name} ${student.last_name}` : user?.name || "Welcome"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              {student?.college_name && (
                <span className="flex items-center gap-1"><Building className="w-3 h-3" />{student.college_name}</span>
              )}
              {student?.program && (
                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{student.program}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left ── */}
          <div className="space-y-5">
            {/* Academic snapshot */}
            <div className="border rounded-xl p-4 bg-card space-y-1">
              <SectionHead label="Academic" />
              <InfoRow label="Year" value={`Year ${student?.current_year || "—"} · ${student?.current_semester || ""}`} />
              <InfoRow label="GPA" value={gpa > 0 ? `${gpa.toFixed(2)} / 10` : "—"} />
              <InfoRow label="Program" value={student?.program || "—"} />
              <InfoRow label="Goal" value={student?.primary_goal || "—"} />
              {gpa > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>GPA</span><span>{gpa.toFixed(2)}/10</span>
                  </div>
                  <Progress value={(gpa / 10) * 100} className="h-1" />
                </div>
              )}
              {student?.current_year && (
                <div className="pt-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Academic progress</span><span>{yearPct}%</span>
                  </div>
                  <Progress value={yearPct} className="h-1" />
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="border rounded-xl p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <SectionHead label="Top Skills" />
                <Link href="/dashboard/skills" className="text-[11px] text-muted-foreground hover:text-foreground">
                  Manage →
                </Link>
              </div>
              {techEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No skills added yet. <Link href="/dashboard/skills" className="underline">Add skills</Link></p>
              ) : (
                <div className="space-y-2.5">
                  {techEntries.slice(0, 5).map(([skill, level]) => (
                    <div key={skill} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-24 truncate flex-shrink-0">{skill}</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/40 rounded-full"
                          style={{ width: `${((level as number) / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-6 text-right">{level as number}/5</span>
                    </div>
                  ))}
                  {techEntries.length > 5 && (
                    <p className="text-[11px] text-muted-foreground pt-1">+{techEntries.length - 5} more</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="border rounded-xl p-4 bg-card">
              <SectionHead label="Quick Access" />
              <div className="space-y-0.5">
                {[
                  { label: "My Courses",      href: "/dashboard/courses",        Icon: BookOpen },
                  { label: "Career Tracks",   href: "/dashboard/career-tracks",  Icon: TrendingUp },
                  { label: "Career Goals",    href: "/dashboard/goals",           Icon: Target },
                  { label: "Skills Tracker",  href: "/dashboard/skills",          Icon: Award },
                  { label: "Reports",         href: "/dashboard/reports",         Icon: BarChart3 },
                ].map(({ label, href, Icon }) => (
                  <Link key={label} href={href} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors group">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Career Plan card */}
            {plan ? (
              <div className="border rounded-xl p-5 bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <SectionHead label="Active Career Plan" />
                    <h2 className="text-sm font-semibold text-foreground">{plan.target_name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {plan.track_type === "higher-studies" ? "Higher Studies" : "Placement"} ·{" "}
                      {plan.difficulty_level} difficulty
                    </p>
                  </div>
                  <Link href="/dashboard/career-tracks/my-plan"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0">
                    View full plan <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Plan stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Progress",  value: `${Math.round(plan.progress)}%`, Icon: TrendingUp },
                    { label: "Total XP",  value: plan.total_xp,                   Icon: Zap },
                    { label: "Streak",    value: `${plan.current_streak}d`,        Icon: Flame },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="border rounded-lg p-3 text-center bg-muted/20">
                      <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <Progress value={plan.progress} className="h-1" />
              </div>
            ) : (
              <div className="border rounded-xl p-5 bg-card text-center">
                <SectionHead label="Career Plan" />
                <p className="text-sm text-muted-foreground mb-3">No career plan yet. Generate one from Career Tracks.</p>
                <Link href="/dashboard/career-tracks"
                  className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors">
                  Browse Career Tracks <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Today's Tasks from career plan */}
            <div className="border rounded-xl p-5 bg-card">
              <div className="flex items-center justify-between mb-3">
                <SectionHead label="Today's Tasks" />
                {plan && (
                  <Link href="/dashboard/career-tracks/my-plan"
                    className="text-[11px] text-muted-foreground hover:text-foreground">
                    All tasks →
                  </Link>
                )}
              </div>

              {!plan ? (
                <p className="text-xs text-muted-foreground">Generate a career plan to see daily tasks here.</p>
              ) : todayTasks.length === 0 ? (
                <div className="flex items-center gap-3 py-3">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No tasks scheduled for today. Check your weekly plan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Summary row */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/40 rounded-full transition-all"
                        style={{ width: `${todayTasks.length > 0 ? ((todayTasks.length - pendingToday) / todayTasks.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {todayTasks.length - pendingToday}/{todayTasks.length} done
                    </span>
                  </div>

                  {todayTasks.map(task => (
                    <div key={task.id} className="space-y-1.5">
                      {/* Morning */}
                      {task.morning_task?.trim() && (
                        <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${
                          task.is_completed ? "border-border/30 opacity-50" : "border-border/60 hover:border-border"
                        } transition-colors`}>
                          <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sun className="w-3 h-3 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {task.morning_task}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">{task.skill_focus}</Badge>
                              <span className="text-[10px] text-muted-foreground">+{task.xp} XP</span>
                            </div>
                          </div>
                          {task.is_completed
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
                          }
                        </div>
                      )}
                      {/* Evening */}
                      {task.evening_task?.trim() && task.evening_task !== task.morning_task && (
                        <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${
                          task.is_completed ? "border-border/30 opacity-50" : "border-border/60 hover:border-border"
                        } transition-colors`}>
                          <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Moon className="w-3 h-3 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {task.evening_task}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">{task.skill_focus}</Badge>
                              <span className="text-[10px] text-muted-foreground">+{task.xp} XP</span>
                            </div>
                          </div>
                          {task.is_completed
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
                          }
                        </div>
                      )}
                    </div>
                  ))}

                  <Link href="/dashboard/career-tracks/my-plan"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground mt-2 py-1.5 rounded-lg border border-dashed border-border/40 hover:border-border/70 transition-colors">
                    Go to My Plan to mark tasks done <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Academic interests + Industry */}
            {(student?.academic_interests?.length || student?.industry_focus?.length) ? (
              <div className="border rounded-xl p-4 bg-card">
                <SectionHead label="Interests & Focus" />
                <div className="space-y-3">
                  {(student?.academic_interests?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">Academic Interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student!.academic_interests.map(i => (
                          <Badge key={i} variant="secondary" className="text-[11px] font-normal">{i}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(student?.industry_focus?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">Industry Focus</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student!.industry_focus.map(i => (
                          <Badge key={i} variant="outline" className="text-[11px] font-normal">{i}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
