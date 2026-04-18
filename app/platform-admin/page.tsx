"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Building2, CircleDollarSign, KeyRound, RefreshCw, ShieldCheck,
  TrendingUp, Users, Settings2, MessageSquareHeart, Star,
  Gauge, Timer, Bot, FileText, Wand2, ThumbsUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

const STORAGE_KEY = "studentpath_platform_admin_key"

type CollegeFeatures = {
  student_registration: boolean
  internship_module: boolean
  placement_module: boolean
  ai_assistant: boolean
  career_tracks: boolean
  analytics_dashboard: boolean
  tpo_management: boolean
  notification_center: boolean
}

type CollegeRow = {
  id: number
  name: string
  email: string
  location: string
  isActive: boolean
  tokenActive: boolean
  totalStudents: number
  activeStudents: number
  freeStudents: number
  trialStudents: number
  proStudents: number
  activationRate: number
  proAdoptionRate: number
  monthlyRevenueEstimate: number
  trialPipelineValue: number
  features: CollegeFeatures
}

type OverviewResponse = {
  generatedAt: string
  proPlanMonthlyPrice: number
  metrics: {
    totalColleges: number
    activeColleges: number
    totalStudents: number
    activeStudents: number
    freeStudents: number
    trialStudents: number
    proStudents: number
    monthlyRecurringRevenue: number
    annualRecurringRevenue: number
    trialPipelineValue: number
  }
  colleges: CollegeRow[]
}

type FeatureKey = keyof CollegeFeatures

type ConfigItem = {
  key: string
  label: string
  category: string
  value: string
  defaultValue: string
  isCustomized: boolean
}

type FeedbackEntry = {
  id: number
  student_id: number
  first_name: string
  last_name: string
  email: string
  program: string
  college_name: string
  overall_rating: number
  ease_of_use: number
  feature_usefulness: number
  ai_quality: number
  ui_design: number
  performance_rating: number
  would_recommend: boolean
  most_useful_feature: string
  least_useful_feature: string
  missing_feature: string
  improvement_suggestion: string
  best_thing: string
  how_often_use: string
  additional_comments: string
  created_at: string
}

type FeedbackStats = {
  totalFeedback: number
  averageOverall: number
  averageEaseOfUse: number
  averageFeatureUsefulness: number
  averageAiQuality: number
  averageUiDesign: number
  averagePerformance: number
  wouldRecommendCount: number
  wouldNotRecommendCount: number
  recommendRate: number
}

const featureLabels: Array<{ key: FeatureKey; label: string; description: string }> = [
  { key: "student_registration", label: "Student Registration", description: "College invite links and onboarding" },
  { key: "internship_module", label: "Internship Module", description: "Internship creation and publishing" },
  { key: "placement_module", label: "Placement Module", description: "Placement drive workflows" },
  { key: "ai_assistant", label: "AI Assistant", description: "AI chat and extraction tools" },
  { key: "career_tracks", label: "Career Tracks", description: "Roadmaps and gamified progression" },
  { key: "analytics_dashboard", label: "Analytics Dashboard", description: "Analytics and reports pages" },
  { key: "tpo_management", label: "TPO Management", description: "Department and TPO user controls" },
  { key: "notification_center", label: "Notification Center", description: "In-app and admin notifications" },
]

const planMixChartConfig = {
  free: { label: "Free", color: "#64748b" },
  trial: { label: "Trial", color: "#f59e0b" },
  pro: { label: "Pro", color: "#10b981" },
} satisfies ChartConfig

const revenueChartConfig = {
  mrr: { label: "MRR", color: "#22c55e" },
  pipeline: { label: "Trial Pipeline", color: "#f59e0b" },
} satisfies ChartConfig

const adoptionChartConfig = {
  activationRate: { label: "Activation %", color: "#38bdf8" },
  proAdoptionRate: { label: "Pro Adoption %", color: "#34d399" },
} satisfies ChartConfig

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-zinc-600"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400">{Number(rating).toFixed(1)}</span>
    </div>
  )
}

type Tab = "overview" | "config" | "feedback"

export default function PlatformAdminPage() {
  const [apiKey, setApiKey] = useState("")
  const [keyInput, setKeyInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [selectedCollege, setSelectedCollege] = useState<CollegeRow | null>(null)
  const [draftFeatures, setDraftFeatures] = useState<CollegeFeatures | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  // Config state
  const [configItems, setConfigItems] = useState<ConfigItem[]>([])
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({})
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)

  // Feedback state
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackRatingDist, setFeedbackRatingDist] = useState<{ overall_rating: number; count: number }[]>([])
  const [feedbackFeatureBreakdown, setFeedbackFeatureBreakdown] = useState<{ most_useful_feature: string; count: number }[]>([])

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY) || ""
    if (stored) {
      setApiKey(stored)
      setKeyInput(stored)
    }
  }, [])

  const loadOverview = useCallback(
    async (keyOverride?: string) => {
      const effectiveKey = (keyOverride ?? apiKey).trim()
      if (!effectiveKey) return

      setLoading(true)
      setError("")

      try {
        const res = await fetch("/api/platform-admin/overview", {
          headers: { "x-platform-admin-key": effectiveKey },
        })

        if (res.status === 401) {
          setError("Invalid platform admin key. Please re-authenticate.")
          setOverview(null)
          return
        }

        if (!res.ok) throw new Error("Failed to load dashboard")

        const data = (await res.json()) as OverviewResponse
        setOverview(data)
      } catch (loadError) {
        console.error(loadError)
        setError("Unable to load platform metrics right now.")
      } finally {
        setLoading(false)
      }
    },
    [apiKey]
  )

  const loadConfig = useCallback(
    async (keyOverride?: string) => {
      const effectiveKey = (keyOverride ?? apiKey).trim()
      if (!effectiveKey) return

      setConfigLoading(true)
      try {
        const res = await fetch("/api/platform-admin/config", {
          headers: { "x-platform-admin-key": effectiveKey },
        })
        if (!res.ok) return

        const data = await res.json()
        setConfigItems(data.globalConfig || [])
        const draft: Record<string, string> = {}
        for (const item of data.globalConfig || []) {
          draft[item.key] = item.value
        }
        setConfigDraft(draft)
      } catch (e) {
        console.error("Failed to load config:", e)
      } finally {
        setConfigLoading(false)
      }
    },
    [apiKey]
  )

  const loadFeedback = useCallback(
    async (keyOverride?: string) => {
      const effectiveKey = (keyOverride ?? apiKey).trim()
      if (!effectiveKey) return

      setFeedbackLoading(true)
      try {
        const res = await fetch("/api/platform-admin/feedback", {
          headers: { "x-platform-admin-key": effectiveKey },
        })
        if (!res.ok) return

        const data = await res.json()
        setFeedbackStats(data.stats || null)
        setFeedbackEntries(data.feedback || [])
        setFeedbackRatingDist(data.ratingDistribution || [])
        setFeedbackFeatureBreakdown(data.featureBreakdown || [])
      } catch (e) {
        console.error("Failed to load feedback:", e)
      } finally {
        setFeedbackLoading(false)
      }
    },
    [apiKey]
  )

  useEffect(() => {
    if (apiKey) {
      void loadOverview()
      void loadConfig()
      void loadFeedback()
    }
  }, [apiKey, loadOverview, loadConfig, loadFeedback])

  const topColleges = useMemo(() => {
    if (!overview) return []
    return [...overview.colleges].sort((a, b) => b.proStudents - a.proStudents).slice(0, 5)
  }, [overview])

  const planMixData = useMemo(() => {
    if (!overview) return []
    return [
      { key: "free", name: "Free", value: overview.metrics.freeStudents, fill: "var(--color-free)" },
      { key: "trial", name: "Trial", value: overview.metrics.trialStudents, fill: "var(--color-trial)" },
      { key: "pro", name: "Pro", value: overview.metrics.proStudents, fill: "var(--color-pro)" },
    ]
  }, [overview])

  const revenueByCollegeData = useMemo(() => {
    if (!overview) return []
    return [...overview.colleges]
      .sort((a, b) => b.monthlyRevenueEstimate - a.monthlyRevenueEstimate)
      .slice(0, 7)
      .map((college) => ({
        name: college.name.length > 14 ? `${college.name.slice(0, 14)}...` : college.name,
        mrr: college.monthlyRevenueEstimate,
        pipeline: college.trialPipelineValue,
      }))
  }, [overview])

  const adoptionTrendData = useMemo(() => {
    if (!overview) return []
    return [...overview.colleges]
      .sort((a, b) => b.totalStudents - a.totalStudents)
      .slice(0, 8)
      .map((college) => ({
        name: college.name.length > 10 ? `${college.name.slice(0, 10)}...` : college.name,
        activationRate: college.activationRate,
        proAdoptionRate: college.proAdoptionRate,
      }))
  }, [overview])

  const handleAuthenticate = async () => {
    const trimmed = keyInput.trim()
    if (!trimmed) {
      setError("Enter platform admin key")
      return
    }

    setApiKey(trimmed)
    window.sessionStorage.setItem(STORAGE_KEY, trimmed)
    await loadOverview(trimmed)
    void loadConfig(trimmed)
    void loadFeedback(trimmed)
  }

  const updateCollegeInState = useCallback(
    (collegeId: number, updater: (college: CollegeRow) => CollegeRow) => {
      setOverview((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          colleges: prev.colleges.map((college) =>
            college.id === collegeId ? updater(college) : college
          ),
        }
      })
    },
    []
  )

  const updateCollegeStatus = async (
    collegeId: number,
    payload: { isActive?: boolean; tokenActive?: boolean }
  ) => {
    if (!apiKey) return

    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/platform-admin/colleges/${collegeId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-platform-admin-key": apiKey,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Status update failed")

      const data = (await res.json()) as { isActive: boolean; tokenActive: boolean }

      updateCollegeInState(collegeId, (college) => ({
        ...college,
        isActive: data.isActive,
        tokenActive: data.tokenActive,
      }))
    } catch (statusError) {
      console.error(statusError)
      setError("Failed to update college status")
    } finally {
      setSaving(false)
    }
  }

  const openFeatureDialog = (college: CollegeRow) => {
    setSelectedCollege(college)
    setDraftFeatures({ ...college.features })
  }

  const saveFeatureFlags = async () => {
    if (!apiKey || !selectedCollege || !draftFeatures) return

    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/platform-admin/colleges/${selectedCollege.id}/features`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-platform-admin-key": apiKey,
          "x-platform-admin-actor": "platform-admin-console",
        },
        body: JSON.stringify({ featureFlags: draftFeatures }),
      })

      if (!res.ok) throw new Error("Feature flag update failed")

      const data = (await res.json()) as { featureFlags: CollegeFeatures }

      updateCollegeInState(selectedCollege.id, (college) => ({
        ...college,
        features: data.featureFlags,
      }))

      setSelectedCollege(null)
      setDraftFeatures(null)
    } catch (featureError) {
      console.error(featureError)
      setError("Failed to update feature access")
    } finally {
      setSaving(false)
    }
  }

  const saveGlobalConfig = async () => {
    if (!apiKey) return

    setConfigSaving(true)
    setError("")

    try {
      const configs = Object.entries(configDraft).map(([key, value]) => ({ key, value }))
      const res = await fetch("/api/platform-admin/config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-platform-admin-key": apiKey,
        },
        body: JSON.stringify({ configs }),
      })

      if (!res.ok) throw new Error("Config save failed")

      // Reload config to reflect saved state
      await loadConfig()
    } catch (err) {
      console.error(err)
      setError("Failed to save configuration")
    } finally {
      setConfigSaving(false)
    }
  }

  // ── Auth gate ─────────────────────────────────────────────────────────
  if (!apiKey || !overview) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100 md:p-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-white">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                StudentPath Platform Admin
              </CardTitle>
              <CardDescription className="text-zinc-300">
                Use platform admin key to access the cross-college business dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-admin-key">Platform Admin Key</Label>
                <Input
                  id="platform-admin-key"
                  type="password"
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
                  placeholder="Enter PLATFORM_ADMIN_KEY"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <Button onClick={handleAuthenticate} disabled={loading} className="w-full">
                <KeyRound className="mr-2 h-4 w-4" />
                {loading ? "Verifying..." : "Open Platform Dashboard"}
              </Button>
              <p className="text-xs text-zinc-400">
                Tip: Configure PLATFORM_ADMIN_KEY in environment variables to secure this console.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // ── Tabs ───────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Gauge className="w-4 h-4" /> },
    { key: "config", label: "Platform Config", icon: <Settings2 className="w-4 h-4" /> },
    { key: "feedback", label: "User Feedback", icon: <MessageSquareHeart className="w-4 h-4" /> },
  ]

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">StudentPath Platform Command Center</h1>
            <p className="text-sm text-zinc-400">
              Last refresh: {new Date(overview.generatedAt).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-zinc-700 bg-zinc-900" onClick={() => { void loadOverview(); void loadConfig(); void loadFeedback() }} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                window.sessionStorage.removeItem(STORAGE_KEY)
                setApiKey("")
                setOverview(null)
                setKeyInput("")
              }}
            >
              Lock Console
            </Button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-zinc-700 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.key === "feedback" && feedbackStats && feedbackStats.totalFeedback > 0 && (
                <Badge className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                  {feedbackStats.totalFeedback}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {error ? <p className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p> : null}

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2">
                  <CardDescription>Colleges</CardDescription>
                  <CardTitle className="flex items-center justify-between text-2xl text-white">
                    {overview.metrics.totalColleges}
                    <Building2 className="h-5 w-5 text-indigo-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400">
                  Active institutions: {overview.metrics.activeColleges}
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2">
                  <CardDescription>Student Base</CardDescription>
                  <CardTitle className="flex items-center justify-between text-2xl text-white">
                    {overview.metrics.totalStudents}
                    <Users className="h-5 w-5 text-sky-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400">
                  Active learners: {overview.metrics.activeStudents}
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Recurring Revenue</CardDescription>
                  <CardTitle className="flex items-center justify-between text-2xl text-white">
                    {money(overview.metrics.monthlyRecurringRevenue)}
                    <CircleDollarSign className="h-5 w-5 text-emerald-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400">
                  ARR estimate: {money(overview.metrics.annualRecurringRevenue)}
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2">
                  <CardDescription>Trial Pipeline</CardDescription>
                  <CardTitle className="flex items-center justify-between text-2xl text-white">
                    {money(overview.metrics.trialPipelineValue)}
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400">
                  Trial students: {overview.metrics.trialStudents}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2"><CardDescription>Free Plan Users</CardDescription><CardTitle className="text-2xl text-white">{overview.metrics.freeStudents}</CardTitle></CardHeader>
                <CardContent className="text-xs text-zinc-400">Potential upgrade pool across colleges</CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2"><CardDescription>Trial Plan Users</CardDescription><CardTitle className="text-2xl text-white">{overview.metrics.trialStudents}</CardTitle></CardHeader>
                <CardContent className="text-xs text-zinc-400">Immediate conversion opportunity to paid plans</CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-2"><CardDescription>Pro Plan Users</CardDescription><CardTitle className="text-2xl text-white">{overview.metrics.proStudents}</CardTitle></CardHeader>
                <CardContent className="text-xs text-zinc-400">Current monetized users driving MRR and ARR</CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-white">Plan Distribution</CardTitle>
                  <CardDescription>Free, trial, and paid mix across all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={planMixChartConfig} className="h-[260px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie data={planMixData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} strokeWidth={2}>
                        {planMixData.map((item) => (<Cell key={item.key} fill={item.fill} />))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Opportunity By College</CardTitle>
                  <CardDescription>Current MRR vs trial conversion potential</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={revenueChartConfig} className="h-[260px] w-full">
                    <BarChart data={revenueByCollegeData} margin={{ left: 10, right: 10, top: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={46} />
                      <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(value) => `Rs ${Math.round(value / 1000)}k`} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (<div className="flex w-full items-center justify-between gap-3"><span>{name}</span><span className="font-semibold">{money(Number(value))}</span></div>)} />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="mrr" fill="var(--color-mrr)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="pipeline" fill="var(--color-pipeline)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-white">Activation vs Pro Adoption</CardTitle>
                  <CardDescription>Where engagement is high but monetization can still improve</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={adoptionChartConfig} className="h-[280px] w-full">
                    <LineChart data={adoptionTrendData} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={48} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="activationRate" stroke="var(--color-activationRate)" strokeWidth={3} dot={{ fill: "var(--color-activationRate)", r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="proAdoptionRate" stroke="var(--color-proAdoptionRate)" strokeWidth={3} dot={{ fill: "var(--color-proAdoptionRate)", r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">College Operations</CardTitle>
                  <CardDescription>
                    Monitor activation, subscription mix (free/trial/pro), and manage college controls.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>College</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Plan Split</TableHead>
                        <TableHead>MRR</TableHead>
                        <TableHead>College Active</TableHead>
                        <TableHead>Token Active</TableHead>
                        <TableHead>Features</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.colleges.map((college) => (
                        <TableRow key={college.id}>
                          <TableCell>
                            <p className="font-medium text-white">{college.name}</p>
                            <p className="text-xs text-zinc-400">{college.email}</p>
                            <p className="text-xs text-zinc-500">{college.location || "Unknown"}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold text-zinc-100">{college.activeStudents}/{college.totalStudents}</p>
                            <p className="text-xs text-zinc-400">Activation: {college.activationRate}%</p>
                          </TableCell>
                          <TableCell className="space-x-1">
                            <Badge variant="secondary">Free {college.freeStudents}</Badge>
                            <Badge className="bg-amber-600 text-white">Trial {college.trialStudents}</Badge>
                            <Badge className="bg-emerald-600 text-white">Pro {college.proStudents}</Badge>
                          </TableCell>
                          <TableCell>{money(college.monthlyRevenueEstimate)}</TableCell>
                          <TableCell>
                            <Switch checked={college.isActive} disabled={saving} onCheckedChange={(checked) => { void updateCollegeStatus(college.id, { isActive: checked }) }} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={college.tokenActive} disabled={saving} onCheckedChange={(checked) => { void updateCollegeStatus(college.id, { tokenActive: checked }) }} />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900" onClick={() => openFeatureDialog(college)}>Manage</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-white">Top Pro Adoption</CardTitle>
                  <CardDescription>Highest paid adoption across institutions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topColleges.map((college) => (
                    <div key={college.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                      <p className="text-sm font-medium text-white">{college.name}</p>
                      <p className="text-xs text-zinc-400">
                        Pro: {college.proStudents} students ({college.proAdoptionRate}%)
                      </p>
                      <p className="text-xs text-emerald-400">MRR: {money(college.monthlyRevenueEstimate)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* ── CONFIG TAB ────────────────────────────────────────────────────── */}
        {activeTab === "config" && (
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings2 className="h-5 w-5 text-sky-400" />
                  Global Platform Configuration
                </CardTitle>
                <CardDescription>
                  These settings apply to all colleges by default. Per-college overrides can be set from the College Operations table.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 rounded-lg bg-zinc-800 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Trial Config */}
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-400" />
                        Free Trial Settings
                      </h3>
                      <div className="space-y-3">
                        {configItems.filter((i) => i.category === "trial").map((item) => (
                          <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-xs text-zinc-500">Default: {item.defaultValue} days</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={365}
                                value={configDraft[item.key] || ""}
                                onChange={(e) => setConfigDraft({ ...configDraft, [item.key]: e.target.value })}
                                className="w-24 border-zinc-700 bg-zinc-900 text-center"
                              />
                              <span className="text-xs text-zinc-500">days</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Pricing & Business Config */}
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                        <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                        Pricing & Business
                      </h3>
                      <div className="space-y-3">
                        {configItems.filter((i) => i.category === "pricing").map((item) => {
                          const isText = item.key === "pro_plan_currency" || item.key === "pro_plan_display_price"
                          const suffix = item.key === "pro_plan_amount_minor" ? "minor units" 
                            : item.key === "pro_plan_duration_months" ? "months"
                            : item.key === "platform_pro_plan_monthly_price" ? "₹/month"
                            : ""
                          return (
                            <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.label}</p>
                                <p className="text-xs text-zinc-500">
                                  Default: {item.defaultValue}
                                  {item.isCustomized && <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px]">Customized</Badge>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type={isText ? "text" : "number"}
                                  min={isText ? undefined : 0}
                                  value={configDraft[item.key] || ""}
                                  onChange={(e) => setConfigDraft({ ...configDraft, [item.key]: e.target.value })}
                                  className="w-28 border-zinc-700 bg-zinc-900 text-center"
                                />
                                {suffix && <span className="text-xs text-zinc-500 w-16">{suffix}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Rate Limit Config */}
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-sky-400" />
                        AI Feature Rate Limits
                      </h3>
                      <div className="space-y-3">
                        {configItems.filter((i) => i.category === "rate_limit").map((item) => {
                          const isWeekly = item.key.includes("career_track") || item.key.includes("resume_analysis")
                          const IconComp = item.key.includes("chat") ? Bot : item.key.includes("resume") ? FileText : item.key.includes("career") ? Wand2 : Star
                          return (
                            <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                              <div className="flex items-center gap-3 flex-1">
                                <IconComp className="w-4 h-4 text-zinc-500 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-white">{item.label}</p>
                                  <p className="text-xs text-zinc-500">
                                    Default: {item.defaultValue} / {isWeekly ? "week" : "day"}
                                    {item.isCustomized && <Badge className="ml-2 bg-sky-500/20 text-sky-400 text-[10px]">Customized</Badge>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  value={configDraft[item.key] || ""}
                                  onChange={(e) => setConfigDraft({ ...configDraft, [item.key]: e.target.value })}
                                  className="w-24 border-zinc-700 bg-zinc-900 text-center"
                                />
                                <span className="text-xs text-zinc-500 w-12">/{isWeekly ? "week" : "day"}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() => {
                          const reset: Record<string, string> = {}
                          for (const item of configItems) reset[item.key] = item.defaultValue
                          setConfigDraft(reset)
                        }}
                      >
                        Reset to Defaults
                      </Button>
                      <Button onClick={saveGlobalConfig} disabled={configSaving}>
                        {configSaving ? "Saving..." : "Save Configuration"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── FEEDBACK TAB ──────────────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <div className="space-y-6">
            {feedbackLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-zinc-800 animate-pulse" />)}
              </div>
            ) : !feedbackStats || feedbackStats.totalFeedback === 0 ? (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <MessageSquareHeart className="w-12 h-12 text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300">No Feedback Yet</h3>
                  <p className="text-sm text-zinc-500 mt-1">Feedback from students will appear here once they start sharing.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Responses</CardDescription>
                      <CardTitle className="text-2xl text-white">{feedbackStats.totalFeedback}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardDescription>Average Overall Rating</CardDescription>
                      <CardTitle className="text-2xl text-white flex items-center gap-2">
                        <StarDisplay rating={feedbackStats.averageOverall} />
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardDescription>Would Recommend</CardDescription>
                      <CardTitle className="flex items-center gap-2 text-2xl text-white">
                        {feedbackStats.recommendRate}%
                        <ThumbsUp className="w-5 h-5 text-emerald-400" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-zinc-400">
                      {feedbackStats.wouldRecommendCount} yes / {feedbackStats.wouldNotRecommendCount} no
                    </CardContent>
                  </Card>
                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardDescription>AI Quality Rating</CardDescription>
                      <CardTitle className="text-2xl text-white flex items-center gap-2">
                        <StarDisplay rating={feedbackStats.averageAiQuality} />
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </section>

                {/* Rating Breakdown */}
                <section className="grid gap-4 lg:grid-cols-2">
                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Category Ratings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Overall Experience", rating: Number(feedbackStats.averageOverall || 0) },
                        { label: "Ease of Use", rating: Number(feedbackStats.averageEaseOfUse || 0) },
                        { label: "Feature Usefulness", rating: Number(feedbackStats.averageFeatureUsefulness || 0) },
                        { label: "AI Quality", rating: Number(feedbackStats.averageAiQuality || 0) },
                        { label: "UI / Design", rating: Number(feedbackStats.averageUiDesign || 0) },
                        { label: "Performance", rating: Number(feedbackStats.averagePerformance || 0) },
                      ].map((cat) => (
                        <div key={cat.label} className="flex items-center justify-between">
                          <span className="text-sm text-zinc-300">{cat.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-zinc-800 rounded-full h-2">
                              <div
                                className="bg-amber-400 h-2 rounded-full transition-all"
                                style={{ width: `${(cat.rating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 w-8 text-right">{cat.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Most Useful Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {feedbackFeatureBreakdown.length === 0 ? (
                        <p className="text-sm text-zinc-500">No data yet</p>
                      ) : (
                        feedbackFeatureBreakdown.map((item, idx) => {
                          const maxCount = feedbackFeatureBreakdown[0]?.count || 1
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">{item.most_useful_feature}</span>
                                <span className="text-xs text-zinc-500">{item.count} votes</span>
                              </div>
                              <div className="w-full bg-zinc-800 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                              </div>
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* Rating Distribution */}
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Rating Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const entry = feedbackRatingDist.find(
                          (d) => d.overall_rating === star
                        )
                        const count = entry?.count || 0
                        const pct =
                          feedbackStats.totalFeedback > 0
                            ? (count / feedbackStats.totalFeedback) * 100
                            : 0
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-16">
                              <span className="text-sm text-zinc-300">{star}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </div>
                            <div className="flex-1 bg-zinc-800 rounded-full h-3">
                              <div
                                className="bg-amber-400 h-3 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 w-12 text-right">
                              {count} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Feedback Entries */}
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Individual Feedback</CardTitle>
                    <CardDescription>Recent feedback from students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {feedbackEntries.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {entry.first_name} {entry.last_name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {entry.email} • {entry.college_name || "N/A"} • {entry.program || "N/A"}
                              </p>
                              <p className="text-xs text-zinc-600 mt-0.5">
                                {new Date(entry.created_at).toLocaleDateString("en-IN", {
                                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarDisplay rating={entry.overall_rating} />
                              {entry.would_recommend !== null && (
                                <Badge className={entry.would_recommend ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                                  {entry.would_recommend ? "Would Recommend" : "Not Yet"}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Rating grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                            {entry.ease_of_use && <div className="bg-zinc-900 rounded px-2 py-1"><span className="text-zinc-500">Ease: </span><span className="text-zinc-300">{entry.ease_of_use}/5</span></div>}
                            {entry.feature_usefulness && <div className="bg-zinc-900 rounded px-2 py-1"><span className="text-zinc-500">Features: </span><span className="text-zinc-300">{entry.feature_usefulness}/5</span></div>}
                            {entry.ai_quality && <div className="bg-zinc-900 rounded px-2 py-1"><span className="text-zinc-500">AI: </span><span className="text-zinc-300">{entry.ai_quality}/5</span></div>}
                            {entry.ui_design && <div className="bg-zinc-900 rounded px-2 py-1"><span className="text-zinc-500">UI: </span><span className="text-zinc-300">{entry.ui_design}/5</span></div>}
                            {entry.performance_rating && <div className="bg-zinc-900 rounded px-2 py-1"><span className="text-zinc-500">Perf: </span><span className="text-zinc-300">{entry.performance_rating}/5</span></div>}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {entry.most_useful_feature && <Badge variant="secondary" className="text-[10px]">Best: {entry.most_useful_feature}</Badge>}
                            {entry.least_useful_feature && <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">Needs work: {entry.least_useful_feature}</Badge>}
                            {entry.how_often_use && <Badge className="bg-sky-500/20 text-sky-400 text-[10px]">Uses: {entry.how_often_use}</Badge>}
                          </div>

                          {/* Text feedback */}
                          {entry.best_thing && (
                            <div className="text-xs"><span className="text-emerald-400 font-medium">Best thing: </span><span className="text-zinc-300">{entry.best_thing}</span></div>
                          )}
                          {entry.missing_feature && (
                            <div className="text-xs"><span className="text-amber-400 font-medium">Missing feature: </span><span className="text-zinc-300">{entry.missing_feature}</span></div>
                          )}
                          {entry.improvement_suggestion && (
                            <div className="text-xs"><span className="text-sky-400 font-medium">Improvement: </span><span className="text-zinc-300">{entry.improvement_suggestion}</span></div>
                          )}
                          {entry.additional_comments && (
                            <div className="text-xs"><span className="text-zinc-400 font-medium">Comments: </span><span className="text-zinc-300">{entry.additional_comments}</span></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* Feature Controls Dialog */}
      <Dialog open={Boolean(selectedCollege)} onOpenChange={(open) => (!open ? setSelectedCollege(null) : null)}>
        <DialogContent className="max-w-xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Feature Controls</DialogTitle>
            <DialogDescription>
              {selectedCollege?.name} - enable or disable platform modules for this college.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {featureLabels.map((feature) => {
              const checked = draftFeatures?.[feature.key] ?? false
              return (
                <div key={feature.key} className="flex items-start justify-between gap-4 rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{feature.label}</p>
                    <p className="text-xs text-zinc-400">{feature.description}</p>
                  </div>
                  <Switch
                    checked={checked}
                    onCheckedChange={(next) => {
                      setDraftFeatures((prev) => {
                        if (!prev) return prev
                        return { ...prev, [feature.key]: next }
                      })
                    }}
                  />
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 bg-zinc-900" onClick={() => setSelectedCollege(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveFeatureFlags()} disabled={saving || !draftFeatures}>
              {saving ? "Saving..." : "Save Controls"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
