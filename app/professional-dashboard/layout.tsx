"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
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
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Hello, Professional</span>
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black">
              P
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
