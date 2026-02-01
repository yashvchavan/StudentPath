"use client"

import { useState, type PropsWithChildren } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminProfile, clearAdminProfileCache } from "@/contexts/AdminProfileContext"
import {
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  Bot,
  DollarSign,
  TrendingUp,
  Bell,
  Database,
  SettingsIcon,
  UserCheck,
  Shield,
  Menu,
  X,
  Download,
  Search,
  Eye,
  LayoutDashboard,
  UsersRound,
  Library,
  School,
  BrainCircuit,
  Wallet,
  LineChart,
  BellRing,
  Boxes,
  Cog,
  UserCog,
  LifeBuoy,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AdminShellProps = PropsWithChildren<{
  title?: string
  description?: string
  showRange?: boolean
  rightContent?: React.ReactNode
}>

const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: UsersRound, label: "Student Management", href: "/admin/students" },
  { icon: Library, label: "Course Catalog", href: "/admin/courses" },
  { icon: School, label: "Program Management", href: "/admin/programs" },
  { icon: BrainCircuit, label: "AI Configuration", href: "/admin/ai" },
  { icon: Wallet, label: "Affiliate Dashboard", href: "/admin/affiliate" },
  { icon: LineChart, label: "Analytics & Reports", href: "/admin/analytics" },
  { icon: BellRing, label: "Notification Center", href: "/admin/notifications" },
  { icon: Boxes, label: "System Integrations", href: "/admin/integrations" },
  { icon: Cog, label: "College Settings", href: "/admin/settings" },
  { icon: UserCog, label: "Admin Users", href: "/admin/users" },
  { icon: LifeBuoy, label: "Support Center", href: "/admin/support" },
]

export default function AdminShell({ title, description, showRange = false, rightContent, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const { adminProfile, setAdminProfile } = useAdminProfile() // Use context instead of local state
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const pathname = usePathname()
  const router = useRouter()

  const [loggingOut, setLoggingOut] = useState(false)

  // � Search filtering logic
  const filteredNav = adminNav.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 🔍 Handle search navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && filteredNav.length > 0) {
      router.push(filteredNav[0].href)
      setSearchQuery("")
      setSearchFocused(false)
    }
  }

  // �🔹 Logout function
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAdminProfile(null); // Clear context state
        clearAdminProfileCache(); // Clear module-level cache
        router.replace("/college-login");
      } else {
        console.error("Logout failed:", data.error);
        setLoggingOut(false)
      }
    } catch (err) {
      console.error("Error logging out:", err);
      setLoggingOut(false)
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-black sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 h-auto"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg">
              {adminProfile?.logo_url ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white border border-zinc-700 flex-shrink-0 shadow-md">
                  <img
                    src={adminProfile.logo_url}
                    alt={adminProfile.name || 'College Logo'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {adminProfile ? (
                  <>
                    <h1 className="text-sm sm:text-base md:text-lg font-bold text-white truncate" title={adminProfile.name ?? undefined}>
                      {adminProfile.name}
                    </h1>
                    <p className="text-xs text-zinc-400 hidden sm:block">Admin Portal</p>
                  </>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-4 w-20 sm:w-24 bg-zinc-800 rounded mb-1" />
                    <div className="h-3 w-12 sm:w-16 bg-zinc-800 rounded hidden sm:block" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center - Search (Hidden on mobile) */}
          <div className="flex-1 max-w-md mx-4 hidden lg:block">
            <div
              className={`relative transition-all duration-300 ${searchFocused ? "scale-[1.02]" : ""
                }`}
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${searchFocused ? "text-blue-400" : "text-zinc-500"
                  }`}
              />
              <Input
                placeholder="Search students, courses, reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`pl-10 bg-zinc-900 text-white border rounded-xl transition-all duration-200 placeholder:text-zinc-500
        ${searchFocused
                    ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                  }`}
              />
            </div>
          </div>


          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-red-600/90 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-600/20 transition-all duration-200 hover:shadow-red-600/40 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
              size="sm"
            >
              {loggingOut ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Logging out...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-700 transform transition-transform duration-300 ease-in-out overflow-y-auto scrollbar-hide ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          style={{ top: '68px', height: 'calc(100vh - 68px)' }}
        >
          <nav className="p-4">
            <ul className="space-y-1">
              {filteredNav.length > 0 ? (
                filteredNav.map((item) => {
                  const active = pathname === item.href
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30"
                          : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white hover:shadow-md hover:shadow-zinc-800/50 hover:scale-[1.02]"
                          }`}
                      >
                        <item.icon className="w-5 h-5 transition-colors duration-200" />
                        <span className="truncate">{item.label}</span>
                      </a>
                    </li>
                  )
                })
              ) : searchQuery ? (
                <li className="px-3 py-4 text-center text-sm text-zinc-500">
                  No results found for "{searchQuery}"
                </li>
              ) : null}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 lg:ml-64 bg-black min-h-screen">
          {(title || description || showRange || rightContent) && (
            <div className="flex items-center justify-between mb-6">
              <div>
                {title && <h2 className="text-3xl font-bold text-white">{title}</h2>}
                {description && <p className="text-zinc-400 mt-1">{description}</p>}
              </div>
              <div className="flex items-center gap-3">
                {rightContent}
                {showRange && (
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-32 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Logout Loading Overlay */}
      {loggingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Logging Out...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we securely log you out
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
