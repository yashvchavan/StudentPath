"use client"

import { useState, useEffect, type PropsWithChildren } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAdminProfile, clearAdminProfileCache } from "@/contexts/AdminProfileContext"
import {
  BookOpen,
  Menu,
  X,
  Search,
  LayoutDashboard,
  UsersRound,
  LineChart,
  BellRing,
  Cog,
  LifeBuoy,
  LogOut,
  Briefcase,
  Laptop,
  Building2,
  UserPlus,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// ── Clean, purposeful navigation ──────────────────────────────────────────
const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard",          href: "/admin",               roles: ["college", "dept_tpo"] },
  { icon: Building2,       label: "Departments",         href: "/admin/departments",   roles: ["college"] },
  { icon: UsersRound,      label: "Student Management",  href: "/admin/students",      roles: ["college", "dept_tpo"] },
  { icon: Briefcase,       label: "Placements",          href: "/admin/placements",    roles: ["college", "dept_tpo"] },
  { icon: Laptop,          label: "Internships",         href: "/admin/internships",   roles: ["college", "dept_tpo"] },
  { icon: Database,        label: "ERP Data",            href: "/admin/erp",           roles: ["college"] },
  { icon: LineChart,       label: "Analytics & Reports", href: "/admin/analytics",     roles: ["college", "dept_tpo"] },
  { icon: UserPlus,        label: "TPO Users",           href: "/admin/tpo-users",     roles: ["college"] },
  { icon: BellRing,        label: "Notifications",       href: "/admin/notifications", roles: ["college", "dept_tpo"] },
  { icon: Cog,             label: "Settings",            href: "/admin/settings",      roles: ["college"] },
  { icon: LifeBuoy,        label: "Support",             href: "/admin/support",       roles: ["college", "dept_tpo"] },
]

const CENTRAL_TPO_ONLY_PATHS = [
  "/admin/departments",
  "/admin/tpo-users",
  "/admin/erp",
  "/admin/settings",
]

type AdminShellProps = PropsWithChildren<{
  title?: string
  description?: string
  showRange?: boolean
  rightContent?: React.ReactNode
}>

interface TpoInfo {
  role: "college" | "dept_tpo"
  isCentralTPO: boolean
  isDeptTPO: boolean
  departmentName?: string
  departmentId?: number
}

const SESSION_KEY_TPO = "adminShell_tpoInfo"

export default function AdminShell({ title, description, rightContent, children }: AdminShellProps) {
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [searchQuery,   setSearchQuery]   = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const { adminProfile, setAdminProfile } = useAdminProfile()
  const [tpoInfo,         setTpoInfo]         = useState<TpoInfo | null>(null)
  const [loadingTpoInfo,  setLoadingTpoInfo]  = useState(true)
  const [loggingOut,      setLoggingOut]      = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const getFallbackRole = (): "college" | "dept_tpo" | null => {
    if (typeof window === "undefined") return null
    try {
      if (localStorage.getItem("tpoData") || document.cookie.includes("tpoData=")) return "dept_tpo"
      if (localStorage.getItem("collegeData") || document.cookie.includes("collegeData=")) return "college"
    } catch { /* ignore */ }
    return null
  }

  // Fetch session info — cached in sessionStorage so only runs ONCE per browser session
  useEffect(() => {
    const fetchTpoInfo = async () => {
      // Restore from sessionStorage immediately to prevent nav flash on page navigation
      const cached = sessionStorage.getItem(SESSION_KEY_TPO)
      if (cached) {
        try {
          setTpoInfo(JSON.parse(cached))
          setLoadingTpoInfo(false)
          return
        } catch { /* fall through */ }
      }

      // While fetching, apply local fallback so nav renders immediately
      const fallback = getFallbackRole()
      if (fallback) {
        setTpoInfo({ role: fallback, isCentralTPO: fallback === "college", isDeptTPO: fallback === "dept_tpo" })
      }

      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(new Error("Timeout")), 6000)
        const res = await fetch("/api/auth/me", { credentials: "include", signal: controller.signal })
        clearTimeout(timer)

        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            const role = data.user.role as "college" | "dept_tpo"
            const info: TpoInfo = {
              role,
              isCentralTPO:   role === "college",
              isDeptTPO:      role === "dept_tpo",
              departmentName: data.user.departmentName,
              departmentId:   data.user.departmentId,
            }
            setTpoInfo(info)
            sessionStorage.setItem(SESSION_KEY_TPO, JSON.stringify(info))
          }
        }
      } catch (err: any) {
        // AbortError from timeout is expected — fallback already applied above
        if (err?.name !== "AbortError") {
          console.warn("[AdminShell] Session fetch error:", err?.message)
        }
      } finally {
        setLoadingTpoInfo(false)
      }
    }

    fetchTpoInfo()
  }, [])

  // Redirect dept_tpo away from central-only pages
  useEffect(() => {
    if (loadingTpoInfo || !tpoInfo?.isDeptTPO) return
    const blocked = CENTRAL_TPO_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))
    if (blocked) router.replace("/admin")
  }, [loadingTpoInfo, pathname, router, tpoInfo])

  // Build nav list — use cached/fallback role to avoid empty sidebar while loading
  const role = tpoInfo?.role ?? getFallbackRole() ?? "college"
  const filteredNav = adminNav
    .filter(item => item.roles.includes(role))
    .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() && filteredNav.length > 0) {
      router.push(filteredNav[0].href)
      setSearchQuery("")
      setSearchFocused(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      sessionStorage.removeItem(SESSION_KEY_TPO)
      const res  = await fetch("/api/auth/logout", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setAdminProfile(null)
        clearAdminProfileCache()
        router.replace("/college-login")
      } else {
        setLoggingOut(false)
      }
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-900 bg-black sticky top-0 z-50">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3">
          {/* Left: hamburger + college branding */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="sm"
              className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 h-auto"
              onClick={() => setSidebarOpen(v => !v)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div className="flex items-center gap-2">
              {adminProfile?.logo_url ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-white border border-zinc-700 flex-shrink-0">
                  <img src={adminProfile.logo_url} alt={adminProfile.name || "College"} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="min-w-0 hidden sm:block">
                {adminProfile ? (
                  <>
                    <h1 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-xs">{adminProfile.name}</h1>
                    <p className="text-xs text-zinc-500">{tpoInfo?.isDeptTPO ? "Dept TPO Portal" : "Admin Portal"}</p>
                  </>
                ) : (
                  <div className="animate-pulse space-y-1">
                    <div className="h-3.5 w-28 bg-zinc-800 rounded" />
                    <div className="h-3 w-16 bg-zinc-800 rounded" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: search */}
          <div className="flex-1 max-w-sm mx-4 hidden lg:block">
            <div className={`relative transition-all duration-150 ${searchFocused ? "scale-[1.01]" : ""}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${searchFocused ? "text-blue-400" : "text-zinc-500"}`} />
              <Input
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`pl-9 h-9 bg-zinc-900 text-sm text-white border rounded-lg placeholder:text-zinc-500 ${searchFocused ? "border-blue-500 ring-1 ring-blue-500/20" : "border-zinc-800"}`}
              />
            </div>
          </div>

          {/* Right: role badge + logout */}
          <div className="flex items-center gap-2">
            {tpoInfo && (
              <Badge variant="outline" className={`hidden md:inline-flex text-xs ${tpoInfo.isCentralTPO ? "border-emerald-600/40 text-emerald-400" : "border-purple-600/40 text-purple-400"}`}>
                {tpoInfo.isCentralTPO ? "Central TPO" : "Dept TPO"}
              </Badge>
            )}
            <Button onClick={handleLogout} disabled={loggingOut} size="sm" className="bg-red-600/90 hover:bg-red-600 text-white text-xs h-8 px-3">
              {loggingOut
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />Logging out</>
                : <><LogOut className="w-3 h-3 mr-1.5" />Logout</>
              }
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 bg-zinc-950 border-r border-zinc-800/60 transform transition-transform duration-200 ease-in-out overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          style={{ top: "53px", height: "calc(100vh - 53px)" }}
        >
          <nav className="p-2.5">
            {tpoInfo?.isDeptTPO && tpoInfo.departmentName && (
              <div className="mb-2 px-3 py-2 bg-purple-600/10 border border-purple-600/20 rounded-lg">
                <p className="text-[11px] text-purple-400 font-medium uppercase tracking-wide">Your Dept</p>
                <p className="text-sm text-white truncate">{tpoInfo.departmentName}</p>
              </div>
            )}
            <ul className="space-y-0.5">
              {filteredNav.map(item => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
              {searchQuery && filteredNav.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-zinc-600">No results for &quot;{searchQuery}&quot;</li>
              )}
            </ul>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 lg:ml-60 min-h-screen bg-black">
          {(title || description || rightContent) && (
            <div className="flex items-start justify-between px-6 pt-6 pb-0">
              <div>
                {title       && <h2 className="text-2xl font-bold text-white">{title}</h2>}
                {description && <p className="text-zinc-400 mt-1 text-sm">{description}</p>}
              </div>
              {rightContent && <div className="flex items-center gap-3 mt-1">{rightContent}</div>}
            </div>
          )}
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Logout overlay */}
      {loggingOut && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-300">Logging out securely...</p>
          </div>
        </div>
      )}
    </div>
  )
}
