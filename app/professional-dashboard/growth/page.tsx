"use client";

import { useState, useEffect } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Github, RefreshCw, Loader2, Plus, X, TrendingUp,
  CheckCircle2, AlertCircle, Zap, Award, Target,
  BarChart2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SkillLevel {
  skill: string;
  level: number; // 0–100
  source: "github" | "profile" | "manual";
}

interface RadarData {
  subject: string;
  You: number;
  Target: number;
}

// ─── Target Role Skill Requirements ───────────────────────────────────────────
const ROLE_PROFILES: Record<string, { skills: string[]; radar: RadarData[] }> = {
  "Frontend Lead": {
    skills: ["React", "TypeScript", "Next.js", "Tailwind", "CSS", "Performance", "Figma"],
    radar: [
      { subject: "Frontend",   You: 0, Target: 90 },
      { subject: "Backend",    You: 0, Target: 30 },
      { subject: "DevOps",     You: 0, Target: 25 },
      { subject: "Design",     You: 0, Target: 70 },
      { subject: "Leadership", You: 0, Target: 65 },
      { subject: "System Design", You: 0, Target: 50 },
    ],
  },
  "Backend Engineer": {
    skills: ["Node.js", "Python", "PostgreSQL", "Redis", "Docker", "REST", "GraphQL"],
    radar: [
      { subject: "Frontend",   You: 0, Target: 20 },
      { subject: "Backend",    You: 0, Target: 90 },
      { subject: "DevOps",     You: 0, Target: 55 },
      { subject: "Design",     You: 0, Target: 10 },
      { subject: "Leadership", You: 0, Target: 40 },
      { subject: "System Design", You: 0, Target: 75 },
    ],
  },
  "Full Stack": {
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "REST"],
    radar: [
      { subject: "Frontend",   You: 0, Target: 70 },
      { subject: "Backend",    You: 0, Target: 70 },
      { subject: "DevOps",     You: 0, Target: 45 },
      { subject: "Design",     You: 0, Target: 35 },
      { subject: "Leadership", You: 0, Target: 40 },
      { subject: "System Design", You: 0, Target: 65 },
    ],
  },
  "DevOps/SRE": {
    skills: ["Docker", "Kubernetes", "AWS", "Linux", "Terraform", "CI/CD", "Python"],
    radar: [
      { subject: "Frontend",   You: 0, Target: 15 },
      { subject: "Backend",    You: 0, Target: 50 },
      { subject: "DevOps",     You: 0, Target: 95 },
      { subject: "Design",     You: 0, Target: 10 },
      { subject: "Leadership", You: 0, Target: 40 },
      { subject: "System Design", You: 0, Target: 70 },
    ],
  },
  "Engineering Manager": {
    skills: ["System Design", "Agile", "Leadership", "Communication", "Architecture", "Hiring"],
    radar: [
      { subject: "Frontend",   You: 0, Target: 40 },
      { subject: "Backend",    You: 0, Target: 50 },
      { subject: "DevOps",     You: 0, Target: 35 },
      { subject: "Design",     You: 0, Target: 30 },
      { subject: "Leadership", You: 0, Target: 95 },
      { subject: "System Design", You: 0, Target: 80 },
    ],
  },
};

function classifySkill(skill: string): "Frontend" | "Backend" | "DevOps" | "Design" | "Leadership" | "System Design" {
  const s = skill.toLowerCase();
  if (["react","angular","vue","next.js","css","html","tailwind","figma","svelte"].some(t => s.includes(t))) return "Frontend";
  if (["node","express","django","flask","spring","postgresql","mysql","mongodb","redis","graphql","python","java","go","ruby","php"].some(t => s.includes(t))) return "Backend";
  if (["docker","kubernetes","aws","gcp","azure","linux","ci/cd","terraform","nginx","jenkins"].some(t => s.includes(t))) return "DevOps";
  if (["figma","photoshop","xd","sketch","ui/ux","design"].some(t => s.includes(t))) return "Design";
  if (["leadership","management","agile","scrum","communication","hiring","mentoring"].some(t => s.includes(t))) return "Leadership";
  return "System Design";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GrowthPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack");
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/professionals/profile");
      const data = await res.json();
      if (data.success && data.data.skills) {
        setSkills(Array.isArray(data.data.skills) ? data.data.skills : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const syncGitHub = async () => {
    const githubUsername = prompt("Enter your GitHub username:");
    if (!githubUsername) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/professionals/skills?github=${encodeURIComponent(githubUsername)}`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.skills) {
        setSkills(data.skills);
        showToast("success", `Synced ${data.skills.length} skills from GitHub!`);
      } else {
        showToast("error", data.error || "Failed to sync from GitHub");
      }
    } catch { showToast("error", "Network error"); }
    finally { setSyncing(false); }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || skills.includes(s)) return;
    setSkills(prev => [...prev, s]);
    setNewSkill("");
  };

  const removeSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill));

  const saveSkills = async () => {
    try {
      await fetch("/api/professionals/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      showToast("success", "Skills saved!");
    } catch { showToast("error", "Failed to save"); }
  };

  // ── Compute radar data ─────────────────────────────────────────────────────
  const roleProfile = ROLE_PROFILES[targetRole];
  const categoryCounts: Record<string, number> = {};
  for (const skill of skills) {
    const cat = classifySkill(skill);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const totalSkills = skills.length || 1;
  const radarData: RadarData[] = roleProfile.radar.map(r => ({
    ...r,
    You: Math.min(100, Math.round(((categoryCounts[r.subject] || 0) / Math.max(1, Object.values(categoryCounts).reduce((a, b) => a + b, 0))) * 300)),
  }));

  // ── Skill gap ──────────────────────────────────────────────────────────────
  const roleSkills = roleProfile.skills;
  const userSkillsLower = new Set(skills.map(s => s.toLowerCase()));
  const matched = roleSkills.filter(s => userSkillsLower.has(s.toLowerCase()));
  const missing = roleSkills.filter(s => !userSkillsLower.has(s.toLowerCase()));
  const matchPct = Math.round((matched.length / roleSkills.length) * 100);

  // ── Free learning resources ────────────────────────────────────────────────
  const LEARNING_MAP: Record<string, string> = {
    "TypeScript": "https://www.typescriptlang.org/docs/",
    "Docker": "https://docs.docker.com/get-started/",
    "Kubernetes": "https://kubernetes.io/docs/tutorials/",
    "AWS": "https://aws.amazon.com/getting-started/",
    "Go": "https://go.dev/learn/",
    "PostgreSQL": "https://www.postgresql.org/docs/current/tutorial.html",
    "React": "https://react.dev/learn",
    "Node.js": "https://nodejs.org/en/learn",
    "Python": "https://docs.python.org/3/tutorial/",
    "GraphQL": "https://graphql.org/learn/",
    "Redis": "https://redis.io/docs/getting-started/",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Skills & Growth</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track your skills, identify gaps, accelerate your growth</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncGitHub} disabled={syncing}
            className="flex items-center gap-1.5 text-sm border border-border/60 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
            Sync from GitHub
          </button>
          <Button size="sm" onClick={saveSkills}>Save Skills</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar Chart */}
        <div className="border border-border/60 rounded-xl p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Skill Radar
            </h2>
            <div>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                className="text-xs border border-border/60 rounded-lg px-2 py-1.5 bg-background">
                {Object.keys(ROLE_PROFILES).map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-2">
              <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Add skills to see your radar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                />
                <Radar name="Target" dataKey="Target" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.2} strokeDasharray="5 5" />
                <Radar name="You" dataKey="You" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-0.5 bg-primary rounded" /> You
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-0.5 bg-muted-foreground rounded border-dashed border border-muted-foreground" /> Target ({targetRole})
            </div>
          </div>
        </div>

        {/* Skill Gap */}
        <div className="border border-border/60 rounded-xl p-5 bg-card">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" /> Gap vs {targetRole}
          </h2>

          {/* Match bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Role Readiness</span>
              <span className={`text-sm font-bold ${matchPct >= 70 ? "text-emerald-600" : matchPct >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                {matchPct}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${matchPct}%`,
                  background: matchPct >= 70 ? "rgb(34 197 94)" : matchPct >= 40 ? "rgb(234 179 8)" : "rgb(239 68 68)",
                }} />
            </div>
          </div>

          {/* Skills you have */}
          {matched.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-medium text-emerald-600 mb-1.5 uppercase tracking-wide">✓ Skills You Have</p>
              <div className="flex flex-wrap gap-1.5">
                {matched.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills to learn */}
          {missing.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-yellow-600 mb-1.5 uppercase tracking-wide">⚡ Skills to Learn</p>
              <div className="space-y-1.5">
                {missing.map(s => (
                  <div key={s} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                    <span className="text-xs text-yellow-700 dark:text-yellow-400">{s}</span>
                    {LEARNING_MAP[s] && (
                      <a href={LEARNING_MAP[s]} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex-shrink-0">
                        Learn Free →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Skills */}
      <div className="border border-border/60 rounded-xl p-5 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> My Skills ({skills.length})
          </h2>
        </div>

        {/* Add skill */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add a skill (e.g. TypeScript, Docker, AWS)..."
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSkill()}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={addSkill} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Skill tags */}
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Add skills manually or sync from GitHub
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  matched.includes(skill)
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-muted/50 text-foreground border-border/60"
                }`}
              >
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

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
