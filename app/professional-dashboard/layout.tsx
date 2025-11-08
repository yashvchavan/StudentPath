"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Brain,
  Briefcase,
  Users,
  GraduationCap,
  TrendingUp,
  CheckSquare,
  Wallet,
  HeartPulse,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { name: "Dashboard", href: "/professional-dashboard", icon: LayoutDashboard },
  { name: "AI Assistant", href: "/professional-dashboard/assistant", icon: Brain },
  { name: "Projects", href: "/professional-dashboard/projects", icon: Briefcase },
  { name: "Network", href: "/professional-dashboard/network", icon: Users },
  { name: "Learning", href: "/professional-dashboard/learning", icon: GraduationCap },
  { name: "Growth", href: "/professional-dashboard/growth", icon: TrendingUp },
  { name: "Productivity", href: "/professional-dashboard/productivity", icon: CheckSquare },
  { name: "Finance", href: "/professional-dashboard/finance", icon: Wallet },
  { name: "Wellness", href: "/professional-dashboard/wellness", icon: HeartPulse },
  { name: "Notifications", href: "/professional-dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/professional-dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('studentData='));
      if (!cookie) return;
      const data = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email || null;
      setDisplayName(name);
      if (name) {
        const parts = name.split(' ');
        const ivals = parts.length === 1 ? parts[0].substring(0, 1) : (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1));
        setInitials(ivals.toUpperCase());
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      // Clear client cookie as well and redirect
      document.cookie = "studentData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      router.push('/professional-login');
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"
          } bg-zinc-900 p-4 flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <h1 className="text-lg font-bold text-yellow-400">Pro Dashboard</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive
                    ? "bg-yellow-500 text-black font-semibold"
                    : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{displayName ? `Welcome, ${displayName}` : 'Welcome Back'}</h2>
            <p className="text-sm text-gray-400">Professional dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-gray-400 text-sm">Signed in as</div>
              <div className="font-medium">{displayName ?? 'Professional'}</div>
            </div>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-3">
                  <Avatar>
                    {/* If portfolio contains an image url we display it via AvatarImage in profile page fetch flow; here use initials fallback */}
                    <AvatarFallback className="bg-yellow-500 text-black font-bold">{initials ?? 'P'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                {/* <DropdownMenuItem onSelect={() => (window.location.href = '/professional-dashboard/profile')}>Profile</DropdownMenuItem> */}
                <DropdownMenuItem onSelect={handleLogout} data-variant="destructive">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
