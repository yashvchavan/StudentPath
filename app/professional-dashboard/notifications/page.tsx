"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Target,
  Award,
  Trash2,
  Briefcase,
  Sparkles,
  FileText,
  RefreshCw,
  Filter,
} from "lucide-react";
import Loading from "@/components/loading";
import { useAuth } from "@/hooks/use-auth";

type NotificationPriority = "high" | "medium" | "low";
type NotificationType = "application" | "resume" | "profile" | "course" | "achievement" | "job";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: NotificationPriority;
  icon: string;
  color: string;
  source: string;
}

const priorityClass: Record<NotificationPriority, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const iconMap = {
  briefcase: Briefcase,
  "file-text": FileText,
  sparkles: Sparkles,
  bell: Bell,
  book: BookOpen,
  target: Target,
  award: Award,
} as const;

function getIcon(name: string) {
  return iconMap[name as keyof typeof iconMap] || Bell;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "high" | "applications" | "resume" | "profile">("all");

  const loadNotifications = async (softRefresh = false) => {
    if (!user) return;
    softRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const res = await fetch(`/api/professionals/notifications?professionalId=${user.id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setNotifications(Array.isArray(data.data) ? data.data : []);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadNotifications();
    } else if (!authLoading) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return !item.read;
      if (activeFilter === "high") return item.priority === "high";
      if (activeFilter === "applications") return item.type === "application";
      if (activeFilter === "resume") return item.type === "resume";
      if (activeFilter === "profile") return item.type === "profile";
      return true;
    });
  }, [activeFilter, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const stats = {
    total: notifications.length,
    high: notifications.filter((n) => n.priority === "high").length,
    unread: unreadCount,
    read: notifications.filter((n) => n.read).length,
  };

  const filterButtons = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "high", label: "High Priority" },
    { key: "applications", label: "Applications" },
    { key: "resume", label: "Resume" },
    { key: "profile", label: "Profile" },
  ] as const;

  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading message="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay updated with your professional progress</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => loadNotifications(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.high}</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.read}</p>
                <p className="text-sm text-muted-foreground">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterButtons.map((item) => (
          <Button
            key={item.key}
            variant={activeFilter === item.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(item.key)}
            className="gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            {item.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((notification) => {
          const Icon = getIcon(notification.icon);
          return (
            <Card
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-md ${!notification.read ? "border-primary/40 bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${!notification.read ? "bg-primary/10" : "bg-muted/50"}`}>
                    <Icon className={`w-5 h-5 ${notification.color}`} />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mt-2">{notification.source}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={priorityClass[notification.priority]}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </span>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications found</h3>
            <p className="text-muted-foreground">Try a different filter or refresh for the latest updates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
