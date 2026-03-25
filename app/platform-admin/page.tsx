"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Building2, CircleDollarSign, KeyRound, RefreshCw, ShieldCheck, TrendingUp, Users } from "lucide-react"
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

export default function PlatformAdminPage() {
  const [apiKey, setApiKey] = useState("")
  const [keyInput, setKeyInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [selectedCollege, setSelectedCollege] = useState<CollegeRow | null>(null)
  const [draftFeatures, setDraftFeatures] = useState<CollegeFeatures | null>(null)

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
          headers: {
            "x-platform-admin-key": effectiveKey,
          },
        })

        if (res.status === 401) {
          setError("Invalid platform admin key. Please re-authenticate.")
          setOverview(null)
          return
        }

        if (!res.ok) {
          throw new Error("Failed to load dashboard")
        }

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

  useEffect(() => {
    if (apiKey) {
      void loadOverview()
    }
  }, [apiKey, loadOverview])

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

      if (!res.ok) {
        throw new Error("Status update failed")
      }

      const data = (await res.json()) as {
        isActive: boolean
        tokenActive: boolean
      }

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

      if (!res.ok) {
        throw new Error("Feature flag update failed")
      }

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
            <Button variant="outline" className="border-zinc-700 bg-zinc-900" onClick={() => void loadOverview()} disabled={loading}>
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

        {error ? <p className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p> : null}

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
            <CardHeader className="pb-2">
              <CardDescription>Free Plan Users</CardDescription>
              <CardTitle className="text-2xl text-white">{overview.metrics.freeStudents}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400">Potential upgrade pool across colleges</CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription>Trial Plan Users</CardDescription>
              <CardTitle className="text-2xl text-white">{overview.metrics.trialStudents}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400">Immediate conversion opportunity to paid plans</CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription>Pro Plan Users</CardDescription>
              <CardTitle className="text-2xl text-white">{overview.metrics.proStudents}</CardTitle>
            </CardHeader>
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
                  <Pie
                    data={planMixData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={88}
                    strokeWidth={2}
                  >
                    {planMixData.map((item) => (
                      <Cell key={item.key} fill={item.fill} />
                    ))}
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
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span>{name}</span>
                            <span className="font-semibold">{money(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
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
                  <Line
                    type="monotone"
                    dataKey="activationRate"
                    stroke="var(--color-activationRate)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-activationRate)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="proAdoptionRate"
                    stroke="var(--color-proAdoptionRate)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-proAdoptionRate)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
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
                        <Switch
                          checked={college.isActive}
                          disabled={saving}
                          onCheckedChange={(checked) => {
                            void updateCollegeStatus(college.id, { isActive: checked })
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={college.tokenActive}
                          disabled={saving}
                          onCheckedChange={(checked) => {
                            void updateCollegeStatus(college.id, { tokenActive: checked })
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 bg-zinc-900"
                          onClick={() => openFeatureDialog(college)}
                        >
                          Manage
                        </Button>
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
      </div>

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
