"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Brain, Briefcase,
  CheckSquare, Bell, Settings, ChevronLeft, ChevronRight,
  LogOut, FileText, Award, FolderGit2, FileBadge
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";

// Settings & Notifications removed from main nav — they're in the dropdown
const navItems = [
  { name: "Dashboard",       href: "/professional-dashboard",               icon: LayoutDashboard },
  { name: "AI Assistant",    href: "/professional-dashboard/assistant",     icon: Brain },
  { name: "Jobs",            href: "/professional-dashboard/jobs",          icon: Briefcase },
  { name: "Applications",    href: "/professional-dashboard/productivity",  icon: CheckSquare },
  { name: "Resume Analyzer", href: "/professional-dashboard/resume",        icon: FileText },
  { name: "Skill Tracker",   href: "/professional-dashboard/skills",        icon: Award },
  { name: "Projects",        href: "/professional-dashboard/projects",      icon: FolderGit2 },
  { name: "Certifications",  href: "/professional-dashboard/certifications",icon: FileBadge },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const router = useRouter();

  const { isAuthenticated, isLoading, user, role } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/professional-login');
      } else if (role !== 'professional') {
        if (role === 'student') router.push('/dashboard');
        else if (role === 'college') router.push('/admin');
        else router.push('/professional-login');
      } else if (user) {
        const name = user.name || user.email || 'Professional';
        setDisplayName(name);
        if (name) {
          const parts = String(name).split(' ');
          const ivals = parts.length === 1
            ? parts[0].substring(0, 2)
            : (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1));
          setInitials(ivals.toUpperCase());
        }
      }
    }
  }, [isAuthenticated, isLoading, role, user, router]);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /**/ }
    document.cookie = "professionalData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "studentData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "collegeData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem('collegeData');
    router.push('/professional-login');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050505] text-white overflow-hidden font-sans">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#0a0a0a] sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-[18px] font-black tracking-tight text-white">
            Dashboard
          </h1>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          ${collapsed ? "w-[72px]" : "w-[268px]"}
          ${mobileMenuOpen ? "flex fixed inset-y-0 left-0 w-64 shadow-2xl" : "hidden md:flex"}
          bg-[#0a0a0a] border-r border-white/[0.06]
          flex-col transition-all duration-300 h-full relative z-50
          shrink-0 overflow-hidden
        `}
      >
        {/* Collapse toggle button — always top right */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 pt-5 pb-4 flex-shrink-0`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 shrink-0">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-[18px] font-black tracking-tight text-white">
                Dashboard
              </h1>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-4 mb-4 shrink-0" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-0.5 custom-scrollbar">
          {!collapsed && (
            <p className="text-[10px] font-bold text-white/30 tracking-[0.15em] uppercase mb-2 px-2">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/professional-dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative
                  ${collapsed ? "justify-center" : "justify-start"}
                  ${isActive
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }
                `}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-yellow-400" : "group-hover:text-yellow-400 transition-colors"}`} />
                {(!collapsed || mobileMenuOpen) && <span className="text-[13px] font-medium tracking-wide truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-4 mt-4 shrink-0" />

        {/* User Dropdown at bottom */}
        <div className="px-3 py-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`
                  w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5
                  transition-all text-left outline-none focus-visible:ring-1 focus-visible:ring-white/20
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                {/* Avatar with notification dot */}
                <div className="relative shrink-0">
                  <Avatar className="w-9 h-9 border border-white/10 rounded-xl">
                    <AvatarFallback className="bg-gradient-to-br from-yellow-600/60 to-yellow-700/60 text-white font-bold rounded-xl text-[13px]">
                      {initials || "P"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {(!collapsed || mobileMenuOpen) && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-white truncate leading-tight">{displayName}</p>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-yellow-500/80 truncate mt-0.5">Professional</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0 rotate-[-90deg]" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align={collapsed ? "center" : "start"}
              sideOffset={8}
              className="w-[248px] bg-zinc-900/95 border-white/10 p-1.5 shadow-2xl rounded-xl backdrop-blur-md"
            >
              {/* User info header */}
              <div className="px-3 py-2.5 mb-1 rounded-lg bg-white/5">
                <p className="text-[13px] font-bold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
              </div>

              <DropdownMenuSeparator className="bg-white/5 my-1" />

              {/* Notifications */}
              <DropdownMenuItem
                onClick={() => router.push('/professional-dashboard/notifications')}
                className="py-2.5 px-3 focus:bg-white/5 rounded-lg cursor-pointer gap-2.5 group"
              >
                <div className="relative">
                  <Bell className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="font-medium text-white text-[13px]">Notifications</span>
              </DropdownMenuItem>

              {/* Settings */}
              <DropdownMenuItem
                onClick={() => router.push('/professional-dashboard/settings')}
                className="py-2.5 px-3 focus:bg-white/5 rounded-lg cursor-pointer gap-2.5"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-white text-[13px]">Account Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/5 my-1" />

              {/* Sign out */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="py-2.5 px-3 focus:bg-red-500/10 rounded-lg cursor-pointer gap-2.5"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="font-bold text-red-400 text-[13px]">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-yellow-500/4 to-transparent pointer-events-none" />
        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
