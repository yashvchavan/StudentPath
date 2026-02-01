"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const { isAuthenticated, isLoading, user, role } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/professional-login');
      } else if (role !== 'professional') {
        // Redirect to appropriate dashboard
        if (role === 'student') router.push('/dashboard');
        else if (role === 'college') router.push('/admin');
        else router.push('/professional-login');
      } else if (user) {
        const name = user.name || user.email || 'Professional';
        setDisplayName(name);
        if (name) {
          const parts = name.split(' ');
          const ivals = parts.length === 1 ? parts[0].substring(0, 1) : (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1));
          setInitials(ivals.toUpperCase());
        }
      }
    }
  }, [isAuthenticated, isLoading, role, user, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      // Clear all session cookies and redirect
      document.cookie = "professionalData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      document.cookie = "studentData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      document.cookie = "collegeData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      localStorage.removeItem('collegeData');
      router.push('/professional-login');
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"
          } bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col transition-all duration-300 h-full`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
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
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
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
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <div className="flex justify-end items-center px-6 py-2 flex-shrink-0 border-b border-zinc-800/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
}
