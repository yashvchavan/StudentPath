"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell, Search, Home, BookOpen, Target, Award, Lightbulb,
  TrendingUp, Bot, Settings, Menu, X, User, LogOut,
  Compass, FileText, Briefcase, GraduationCap, Lock,
  Sparkles, Clock,
} from "lucide-react"
import Link from "next/link"
import { useStudentData } from "../app/contexts/StudentDataContext"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ProfileModal } from "./profile-modal"
import { UpgradeModal } from "./subscription/UpgradeModal"
import { ProUpgradeFAB } from "./subscription/ProUpgradeFAB"
import { FeedbackModal } from "./feedback-modal"
import { MessageSquareHeart } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

interface StudentProfile {
  student_id: number
  name: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  college?: string
  college_details?: any
  program?: string
  department?: string
  current_year?: number
  semester?: number
  current_semester?: number
  current_gpa?: number
  enrollment_year?: number
  gender?: string
  date_of_birth?: string
  country?: string
  bio?: string
  profile_picture?: string | null
  academic_interests?: string
  technical_skills?: string
  soft_skills?: string
  language_skills?: string
  primary_goal?: string
  secondary_goal?: string
  timeline?: string
  location_preference?: string
  industry_focus?: string
  intensity_level?: string
  role?: string
  status?: string
  is_active?: number
  created_at?: string
  updated_at?: string
}

interface SubscriptionState {
  isProActive: boolean
  status: "trialing" | "active" | "trial_expired" | "expired" | "free" | null
  daysLeft: number | null
  loaded: boolean
}

// Sidebar items that require a pro plan after trial
const PRO_KEYS = new Set([
  "career-tracks", "internships", "placement",
  "recommendations", "reports", "assistant", "resume", "notifications",
])

const ALL_SIDEBAR_ITEMS = [
  { icon: Home,         label: "Dashboard",       href: "/dashboard",                           key: "dashboard" },
  { icon: BookOpen,     label: "My Courses",       href: "/dashboard/courses",                   key: "courses" },
  { icon: Target,       label: "Career Goals",     href: "/dashboard/goals",                     key: "goals" },
  { icon: Compass,      label: "Career Tracks",    href: "/dashboard/career-tracks",             key: "career-tracks" },
  { icon: Briefcase,    label: "Internships",      href: "/dashboard/career-tracks/internships", key: "internships" },
  { icon: GraduationCap,label: "Placements",       href: "/dashboard/career-tracks/placement",   key: "placement" },
  { icon: Award,        label: "Skills Tracker",   href: "/dashboard/skills",                    key: "skills" },
  { icon: Lightbulb,    label: "Recommendations",  href: "/dashboard/recommendations",           key: "recommendations" },
  //{ icon: TrendingUp,   label: "Progress Reports", href: "/dashboard/reports",                   key: "reports" },
  { icon: Bot,          label: "AI Assistant",     href: "/dashboard/assistant",                 key: "assistant" },
  { icon: FileText,     label: "Resume Analyzer",  href: "/dashboard/resume",                    key: "resume" },
  { icon: Bell,         label: "Notifications",    href: "/dashboard/notifications",             key: "notifications" },
  { icon: Settings,     label: "Settings",         href: "/dashboard/settings",                  key: "settings" },
]

export default function DashboardLayout({ children, currentPage = "dashboard" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [profileData, setProfileData] = useState<StudentProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [lockedFeatureLabel, setLockedFeatureLabel] = useState<string>("")
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isProActive: true, // optimistically true to avoid flash
    status: null,
    daysLeft: null,
    loaded: false,
  })

  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { studentData, isLoading: contextLoading } = useStudentData()
  const router = useRouter()

  // ── Fetch profile ─────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true)
      const response = await fetch("/api/settings", { credentials: "include" })
      if (!response.ok) return
      const data = await response.json()
      if (data.success && data.profile) setProfileData(data.profile)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoadingProfile(false)
    }
  }

  // ── Fetch subscription status ─────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setSubscription({
        isProActive: data.isProActive,
        status: data.status,
        daysLeft: data.daysLeft,
        loaded: true,
      })
    } catch {
      setSubscription((s) => ({ ...s, loaded: true }))
    }
  }, [])

  useEffect(() => { fetchProfile() }, [])
  useEffect(() => { fetchSubscription() }, [fetchSubscription])

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login")
  }, [authLoading, isAuthenticated, router])

  // ── Handle click on a pro-locked nav item ─────────────────────────────
  const handleLockedClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault()
    setLockedFeatureLabel(label)
    setUpgradeOpen(true)
  }

  // After successful payment, refresh subscription status
  const handlePaymentSuccess = () => {
    fetchSubscription()
  }

  // ── Display helpers ───────────────────────────────────────────────────
  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.[0] || ""
    const last = lastName?.[0] || ""
    return (first + last).toUpperCase() || "U"
  }

  const displayName = profileData
    ? `${profileData.first_name} ${profileData.last_name}`
    : studentData
      ? `${studentData.first_name} ${studentData.last_name}`
      : user?.name || "Loading..."

  const displayEmail = profileData?.email || studentData?.email || user?.email || ""
  const displayProgram = profileData?.program || studentData?.program || ""
  const displaySemester = profileData?.current_semester || studentData?.current_semester || "-"
  const displayGPA = profileData?.current_gpa || studentData?.current_gpa || null
  const displayInitials = getInitials(
    profileData?.first_name || studentData?.first_name || (String(user?.name ?? '').split(' ')[0]),
    profileData?.last_name || studentData?.last_name || (String(user?.name ?? '').split(' ').slice(1).join(' '))
  )
  const profilePicture = profileData?.profile_picture

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      const data = await res.json()
      if (data.success) window.location.href = "/login"
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // ── Trial / expiry banner ─────────────────────────────────────────────
  const TrialBanner = () => {
    if (!subscription.loaded) return null

    if (subscription.status === "trialing" && subscription.daysLeft !== null) {
      return (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Free trial: <span className="font-semibold">{subscription.daysLeft}d left</span>
          </span>
        </div>
      )
    }

    if (subscription.status === "trial_expired" || subscription.status === "expired") {
      return (
        <div
          className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-colors"
          onClick={() => { setLockedFeatureLabel(""); setUpgradeOpen(true) }}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Trial ended — <span className="font-semibold underline">Upgrade to Pro</span></span>
        </div>
      )
    }

    if (subscription.status === "active" && subscription.daysLeft !== null && subscription.daysLeft <= 30) {
      return (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Pro renews in <span className="font-semibold">{subscription.daysLeft}d</span></span>
        </div>
      )
    }

    return null
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card shrink-0 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-muted/80 transition-all duration-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="hidden sm:block">
              <img src="/logo.png" alt="StudentPath Logo" className="h-15 w-auto" />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className={`relative transition-all duration-300 ${searchFocused ? "scale-105" : ""}`}>
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? "text-primary" : "text-muted-foreground"}`}
              />
              <Input
                placeholder="Search courses, skills, resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`pl-10 bg-background border transition-all duration-200 rounded-xl
                  ${searchFocused ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/40"}`}
              />
            </div>
          </div>

          {/* Right: feedback + user dropdown */}
          <div className="flex items-center gap-3">
            {/* Feedback Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="relative group flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <span className="relative">
                <MessageSquareHeart className="w-[18px] h-[18px] transition-all group-hover:scale-110" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              </span>
              <span className="hidden sm:inline text-sm font-medium">Feedback</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 hover:bg-muted/80 transition-all duration-200"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profilePicture || "/placeholder.svg"} alt={displayName} />
                    <AvatarFallback>{displayInitials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">
                      {loadingProfile || authLoading ? "Loading..." : displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">Semester {displaySemester}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{loadingProfile || authLoading ? "Loading..." : displayName}</p>
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsProfileOpen(true)} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body: sidebar + main in a flex row that fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-card border-r
            flex-shrink-0 flex flex-col
            transform transition-all duration-300 ease-out
            h-full overflow-y-auto
            ${sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"}
          `}
        >
          <div className="flex flex-col h-full">
            {/* User profile section */}
            <div className="p-4 border-b hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profilePicture || "/placeholder.svg"} alt={displayName} />
                  <AvatarFallback>{displayInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {loadingProfile || authLoading ? "Loading..." : displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{displayProgram}</p>
                  <p className="text-xs font-medium text-primary">
                    CGPA: {displayGPA ? Number(displayGPA).toFixed(2) : "-"}
                  </p>
                  {/* Plan badge */}
                  {subscription.loaded && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5
                      ${subscription.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : subscription.status === "trialing"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                      {subscription.status === "active" && <Sparkles className="w-2.5 h-2.5" />}
                      {subscription.status === "trialing" && <Clock className="w-2.5 h-2.5" />}
                      {subscription.status === "active"
                        ? "Pro"
                        : subscription.status === "trialing"
                          ? "Trial"
                          : "Free"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trial / renewal banner */}
            <div className="pt-3">
              <TrialBanner />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pb-4 overflow-y-auto">
              <ul className="space-y-1.5">
                {ALL_SIDEBAR_ITEMS.map((item) => {
                  const isActive = item.key === currentPage
                  const isLocked =
                    subscription.loaded &&
                    !subscription.isProActive &&
                    PRO_KEYS.has(item.key)

                  if (isLocked) {
                    return (
                      <li key={item.key}>
                        <button
                          onClick={(e) => handleLockedClick(e, item.label)}
                          className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{item.label}</span>
                          <Lock className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </li>
                    )
                  }

                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative overflow-hidden
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:translate-x-1"
                          }
                        `}
                      >
                        <item.icon className={`w-4 h-4 transition-all duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                        {item.label}
                        {isActive && (
                          <div className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Upgrade CTA (when trial expired or free) */}
            {subscription.loaded && !subscription.isProActive && subscription.status !== "trialing" && (
              <div className="p-4 border-t">
                <button
                  onClick={() => { setLockedFeatureLabel(""); setUpgradeOpen(true) }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-in fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content — scrollable */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 transition-all duration-300">{children}</main>
      </div>

      {/* Modals */}
      <ProfileModal
        student={profileData}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel={lockedFeatureLabel}
        onSuccess={handlePaymentSuccess}
      />

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* Floating upgrade nudge (visible during trial and after trial expires) */}
      <ProUpgradeFAB
        status={subscription.status}
        daysLeft={subscription.daysLeft}
        onSuccess={fetchSubscription}
      />
    </div>
  )
}
