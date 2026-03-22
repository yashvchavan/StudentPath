"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import {
  Award, RefreshCw, ExternalLink, BookOpen, AlertTriangle,
  CheckCircle2, Zap, Shield, TrendingUp, ChevronRight,
  Clock, Eye,
} from "lucide-react"

// ─── Types (mirror the API responses) ─────────────────────────────────────────

type SkillSource = "github" | "leetcode" | "resume"

// Keywords that mark non-technical / soft skills
const SOFT_SKILL_KEYWORDS = new Set([
  "communication", "leadership", "teamwork", "collaboration", "problem solving",
  "critical thinking", "time management", "adaptability", "creativity",
  "public speaking", "negotiation", "emotional intelligence", "project management",
  "presentation", "interpersonal", "management", "organisation", "conflict",
  "listening", "empathy", "motivation", "decision making", "analytical",
])

function isNonTechnical(skill: string) {
  const lower = skill.toLowerCase()
  return SOFT_SKILL_KEYWORDS.has(lower) ||
    [...SOFT_SKILL_KEYWORDS].some((kw) => lower.includes(kw))
}

interface MergedSkill {
  skill: string
  proficiency: number      // 0-10
  confidence: number       // 0.00-1.00
  sources: SkillSource[]
}

interface MergeResult {
  skills: MergedSkill[]
  totalSkills: number
  sourceCoverage: Record<SkillSource, number>
  mergedAt: string
}

interface CourseResult {
  title: string
  channel: string
  url: string
  duration: string
  thumbnail: string
  viewCount: string
}

interface SkillCourseRecommendation {
  skill: string
  fromCache: boolean
  courses: CourseResult[]
  fetchedAt: string
}

// ─── Source config ─────────────────────────────────────────────────────────────

const SOURCE_META: Record<SkillSource, { label: string; emoji: string; color: string; bg: string }> = {
  github:   { label: "GitHub",   emoji: "🐙", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  leetcode: { label: "LeetCode", emoji: "💻", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  resume:   { label: "Resume",   emoji: "📄", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30" },
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SourcePill({ source }: { source: SkillSource }) {
  const m = SOURCE_META[source]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${m.bg} ${m.color}`}>
      <span>{m.emoji}</span>
      <span>{m.label}</span>
    </span>
  )
}

function ConfidenceRing({ value }: { value: number }) {
  // value: 0-1
  const pct = Math.round(value * 100)
  const circumference = 2 * Math.PI * 18
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 90 ? "#22c55e" : pct >= 75 ? "#3b82f6" : pct >= 60 ? "#f59e0b" : "#ef4444"

  return (
    <div className="relative inline-flex items-center justify-center w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3"
          className="text-muted/30" />
        <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute text-xs font-bold">{pct}%</span>
    </div>
  )
}

function ProficiencyBar({ value }: { value: number }) {
  // value: 0-10
  const pct = value * 10
  const color =
    pct >= 80 ? "bg-green-500" :
    pct >= 60 ? "bg-blue-500"  :
    pct >= 40 ? "bg-yellow-500" : "bg-red-500"

  const label =
    value >= 8 ? "Expert" :
    value >= 6 ? "Advanced" :
    value >= 4 ? "Intermediate" : "Beginner"

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-20 text-right">{label} ({value}/10)</span>
    </div>
  )
}

function SkillCard({ skill }: { skill: MergedSkill }) {
  const isVerified = skill.sources.length >= 2

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/30 hover:border-border transition-all duration-200 group">
      {/* Confidence ring */}
      <ConfidenceRing value={skill.confidence} />

      {/* Skill info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground truncate">{skill.skill}</span>
          {isVerified && (
            <span title="Verified across multiple sources">
  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
</span>
          )}
        </div>
        <ProficiencyBar value={skill.proficiency} />
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {skill.sources.map((src) => <SourcePill key={src} source={src} />)}
        </div>
      </div>
    </div>
  )
}

function CourseCard({ course }: { course: CourseResult }) {
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/30 hover:border-primary/40 transition-all duration-200"
    >
      {/* Thumbnail */}
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-24 h-16 object-cover rounded-lg shrink-0 bg-muted"
        />
      ) : (
        <div className="w-24 h-16 bg-muted rounded-lg shrink-0 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
          {course.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{course.channel}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {course.duration && course.duration !== "Unknown" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />{course.duration}
            </span>
          )}
          {course.viewCount && course.viewCount !== "0 views" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />{course.viewCount}
            </span>
          )}
        </div>
      </div>

      <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
    </a>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  iconBg,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  iconClass: string
  iconBg: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconClass}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAnalyze, loading }: { onAnalyze: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Award className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Your Skill Passport is empty</h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        Connect your GitHub and LeetCode profiles, then run the analysis to
        automatically build your verified skill profile.
      </p>
      <Button onClick={onAnalyze} disabled={loading} size="lg">
        {loading
          ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing…</>
          : <><Zap className="w-4 h-4 mr-2" />Run Skill Analysis</>}
      </Button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SkillPassportPage() {
  const { user, isLoading: authLoading } = useAuth()

  // Data state
  const [mergeResult,   setMergeResult]   = useState<MergeResult | null>(null)
  const [courses,       setCourses]       = useState<SkillCourseRecommendation[]>([])
  const [missingSkills, setMissingSkills] = useState<string[]>([])

  // UI state
  const [analyzeLoading,  setAnalyzeLoading]  = useState(false)
  const [courseLoading,   setCourseLoading]    = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [activeTab,       setActiveTab]       = useState<"verified" | "gap" | "courses">("verified")
  const [lastAnalyzed,    setLastAnalyzed]    = useState<string | null>(null)

  const studentId = user?.id

  // ── Load cached skills on mount ────────────────────────────────────────────
  const loadSkills = useCallback(async () => {
    if (!studentId) return
    try {
      const res  = await fetch(`/api/integrations/skill-merge?studentId=${studentId}`)
      const data = await res.json()
      if (data.success && data.skills?.length) {
        // Rebuild a MergeResult-like shape from the flat DB records
        const skills: MergedSkill[] = data.skills.map((s: any) => ({
          skill:       s.skillName,
          proficiency: s.proficiency,
          confidence:  s.confidence,
          sources:     s.sources,
        }))
        const coverage = { github: 0, leetcode: 0, resume: 0 }
        skills.forEach((s) => s.sources.forEach((src) => coverage[src]++))
        setMergeResult({ skills, totalSkills: skills.length, sourceCoverage: coverage, mergedAt: data.skills[0]?.updatedAt ?? "" })
        setLastAnalyzed(data.skills[0]?.updatedAt ?? null)
      }
    } catch { /* silent — first visit */ }
  }, [studentId])

  useEffect(() => { if (!authLoading && studentId) loadSkills() }, [authLoading, studentId, loadSkills])

  // ── Auto-load courses when Courses tab is opened ────────────────────────────
  useEffect(() => {
    if (activeTab === "courses" && courses.length === 0 && !courseLoading && mergeResult) {
      loadCourses()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ── Run full analysis ──────────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!studentId) return
    setAnalyzeLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/integrations/skill-merge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? "Analysis failed")
      setMergeResult(data.result)
      setLastAnalyzed(new Date().toISOString())
    } catch (e: any) {
      setError(e.message ?? "Something went wrong")
    } finally {
      setAnalyzeLoading(false)
    }
  }

  // ── Load course recommendations ────────────────────────────────────────────
  const loadCourses = async () => {
    if (!studentId) return
    setCourseLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/recommendations/courses?studentId=${studentId}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? "Course fetch failed")
      setCourses(data.data?.skills ?? [])
      setMissingSkills(data.missingSkills ?? [])
      setActiveTab("courses")
    } catch (e: any) {
      setError(e.message ?? "Something went wrong")
    } finally {
      setCourseLoading(false)
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const allSkills      = mergeResult?.skills ?? []
  const techSkills     = allSkills.filter((s) => !isNonTechnical(s.skill))
  const softSkills     = allSkills.filter((s) => isNonTechnical(s.skill))
  const verifiedSkills = allSkills.filter((s) => s.sources.length >= 2)

  // Always show the 5 lowest-proficiency skills as improvement areas
  const gapSkills = [...allSkills]
    .sort((a, b) => a.proficiency - b.proficiency)
    .slice(0, 5)

  const avgConfidence = allSkills.length
    ? Math.round((allSkills.reduce((a, s) => a + s.confidence, 0) / allSkills.length) * 100)
    : 0

  const tabs = [
    { key: "verified", label: "All Skills",             count: allSkills.length },
    { key: "gap",      label: "Skill Gap",              count: gapSkills.length },
    { key: "courses",  label: "Recommended Courses",    count: courses.reduce((a, c) => a + c.courses.length, 0) },
  ] as const

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <DashboardLayout currentPage="skills">
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
          </div>
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="skills">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Award className="w-8 h-8 text-primary" />
              Skill Passport
            </h1>
            <p className="text-muted-foreground mt-1">
              Your verified skill profile — powered by GitHub, LeetCode &amp; Resume analysis
            </p>
            {lastAnalyzed && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Last analyzed: {new Date(lastAnalyzed).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCourses}
              disabled={courseLoading || !mergeResult}
              className="gap-1.5"
            >
              {courseLoading
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <BookOpen className="w-3.5 h-3.5" />}
              {courseLoading ? "Loading…" : "Get Courses"}
            </Button>
            <Button
              size="sm"
              onClick={runAnalysis}
              disabled={analyzeLoading}
              className="gap-1.5"
            >
              {analyzeLoading
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Zap className="w-3.5 h-3.5" />}
              {analyzeLoading ? "Analyzing…" : "Run Analysis"}
            </Button>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Stat row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Award}        label="Total Skills"          value={allSkills.length}      iconClass="text-primary"    iconBg="bg-primary/10" />
          <StatCard icon={Shield}       label="Verified (2+ sources)" value={verifiedSkills.length} iconClass="text-green-500"  iconBg="bg-green-500/10" />
          <StatCard icon={TrendingUp}   label="Avg Confidence"        value={`${avgConfidence}%`}   iconClass="text-blue-500"   iconBg="bg-blue-500/10" />
          <StatCard icon={AlertTriangle} label="Top Skill Gaps"       value={gapSkills.length}      iconClass="text-yellow-500" iconBg="bg-yellow-500/10" />
        </div>

        {/* ── Source coverage pills ─────────────────────────────────────────── */}
        {mergeResult && (
          <div className="flex flex-wrap gap-3">
            {(["github", "leetcode", "resume"] as SkillSource[]).map((src) => {
              const m = SOURCE_META[src]
              const n = mergeResult.sourceCoverage[src]
              return (
                <div key={src} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${m.bg} ${m.color}`}>
                  <span className="text-base">{m.emoji}</span>
                  <span className="font-medium">{m.label}</span>
                  <Badge variant="secondary" className="text-xs h-5">{n} skills</Badge>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!mergeResult && !analyzeLoading && (
          <EmptyState onAnalyze={runAnalysis} loading={analyzeLoading} />
        )}

        {/* ── Tabbed content ────────────────────────────────────────────────── */}
        {mergeResult && (
          <div className="space-y-4">
            {/* Tab nav */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === t.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full
                      ${activeTab === t.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab: All Skills ───────────────────────────────────────────── */}
            {activeTab === "verified" && (
              <div className="space-y-4">
                {/* Technical skills */}
                {techSkills.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Technical Skills
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">{techSkills.length} skills</Badge>
                      </CardTitle>
                      <CardDescription>Programming languages, frameworks, tools — from GitHub, LeetCode &amp; Resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {techSkills.map((s) => <SkillCard key={s.skill} skill={s} />)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Soft / non-technical skills */}
                {softSkills.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        Soft &amp; Non-Technical Skills
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs">{softSkills.length} skills</Badge>
                      </CardTitle>
                      <CardDescription>Communication, leadership, teamwork and other interpersonal skills</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {softSkills.map((s) => <SkillCard key={s.skill} skill={s} />)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {allSkills.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No skills found. Run the analysis to populate your Skill Passport.
                  </p>
                )}
              </div>
            )}

            {/* ── Tab: Skill Gap ────────────────────────────────────────────── */}
            {activeTab === "gap" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Top 5 Skills to Improve
                    </CardTitle>
                    <CardDescription>
                      Your 5 lowest-proficiency skills — focus here to level up fastest
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {gapSkills.length > 0 ? (
                      <div className="space-y-3">
                        {gapSkills.map((s, idx) => (
                          <div key={s.skill} className="flex items-center gap-3 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-yellow-500">#{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{s.skill}</span>
                                <div className="flex gap-1">
                                  {s.sources.map((src) => <SourcePill key={src} source={src} />)}
                                </div>
                              </div>
                              <ProficiencyBar value={s.proficiency} />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 text-xs gap-1"
                              onClick={() => {
                                setMissingSkills([s.skill])
                                loadCourses()
                              }}
                            >
                              <BookOpen className="w-3 h-3" /> Learn
                            </Button>
                          </div>
                        ))}

                        <Button
                          className="w-full gap-2 mt-2"
                          variant="outline"
                          onClick={loadCourses}
                          disabled={courseLoading}
                        >
                          {courseLoading
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <ChevronRight className="w-4 h-4" />}
                          {courseLoading ? "Finding courses…" : "Get Courses for All 5 Gaps"}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-12">
                        Run the analysis first to see your skill gaps.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Info card */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex gap-3">
                    <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">How gaps are calculated</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        We always show your 5 lowest-scored skills so you have clear improvement targets,
                        regardless of how strong your overall profile is.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Tab: Recommended Courses ──────────────────────────────────── */}
            {activeTab === "courses" && (
              <div className="space-y-4">
                {/* Auto-load if empty when tab is opened */}
                {courses.length === 0 && !courseLoading && mergeResult && (
                  <div className="flex flex-col items-center py-10 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Fetching course recommendations…</p>
                      <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                        Loading YouTube courses for your top skill gaps.
                      </p>
                    </div>
                    <Button onClick={loadCourses} disabled={courseLoading} className="gap-2">
                      <BookOpen className="w-4 h-4" />Load Courses
                    </Button>
                  </div>
                )}

                {courseLoading && (
                  <div className="flex flex-col items-center py-10 gap-4">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground text-sm">Searching YouTube for courses…</p>
                  </div>
                )}

                {courses.map((rec) => (
                  <Card key={rec.skill}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {rec.skill}
                        </CardTitle>
                        {rec.fromCache && (
                          <Badge variant="outline" className="text-xs">Cached</Badge>
                        )}
                      </div>
                      <CardDescription>{rec.courses.length} courses found on YouTube</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rec.courses.map((c, i) => <CourseCard key={i} course={c} />)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
