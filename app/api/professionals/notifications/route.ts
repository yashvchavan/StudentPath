import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureProfessionalSchema, ensureResumeSchema } from "@/lib/schema";

type Priority = "high" | "medium" | "low";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: Priority;
  icon: string;
  color: string;
  source: string;
};

type ProfileCheck = {
  enabled: boolean;
  title: string;
  message: string;
  priority: Priority;
  color: string;
};

function toBool(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return false;
}

function timeAgo(dateLike: string | Date | null | undefined): string {
  if (!dateLike) return "Recently";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function priorityForApplication(status: string): Priority {
  const lower = String(status || "").toLowerCase();
  if (["offer", "interview", "screening"].includes(lower)) return "high";
  if (["applied", "saved"].includes(lower)) return "medium";
  return "low";
}

function statusLabel(status: string): string {
  switch (String(status || "").toLowerCase()) {
    case "applied": return "Application submitted";
    case "screening": return "Application in screening";
    case "interview": return "Interview update";
    case "offer": return "Offer received";
    case "rejected": return "Application closed";
    default: return "Application saved";
  }
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  const { searchParams } = new URL(req.url);
  const fallbackProfessionalId = searchParams.get("professionalId");

  const user = authUser && authUser.role === "professional"
    ? authUser
    : (fallbackProfessionalId ? { id: Number(fallbackProfessionalId), role: "professional" as const } : null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await pool.getConnection();
  try {
    await ensureProfessionalSchema(connection);
    await ensureResumeSchema(connection);

    const [profileRows]: any = await connection.execute(
      `SELECT id, first_name, last_name, company, designation, skills, projects, certifications, updated_at
       FROM professionals
       WHERE id = ?`,
      [user.id]
    );
    const profile = profileRows?.[0] || {};

    const [applicationRows]: any = await connection.execute(
      `SELECT id, job_title, company, status, location, updated_at
       FROM job_applications
       WHERE user_id = ? AND user_type = 'professional'
       ORDER BY updated_at DESC
       LIMIT 10`,
      [user.id]
    );

    const [analysisRows]: any = await connection.execute(
      `SELECT id, company_name, target_role, ats_score, created_at
       FROM resume_analyses
       WHERE professional_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [user.id]
    );

    const notifications: NotificationItem[] = [];

    for (const app of applicationRows || []) {
      const priority = priorityForApplication(app.status);
      notifications.push({
        id: `app-${app.id}`,
        type: "application",
        title: statusLabel(app.status),
        message: `${app.job_title} at ${app.company}${app.location ? ` · ${app.location}` : ""}`,
        time: timeAgo(app.updated_at),
        read: priority === "low",
        priority,
        icon: "briefcase",
        color: priority === "high" ? "text-yellow-500" : priority === "medium" ? "text-blue-500" : "text-gray-500",
        source: "applications",
      });
    }

    for (const analysis of analysisRows || []) {
      const score = Number(analysis.ats_score || 0);
      notifications.push({
        id: `resume-${analysis.id}`,
        type: "resume",
        title: `ATS analysis ready for ${analysis.company_name}`,
        message: `Your resume scored ${score}/100 for ${analysis.target_role}.`,
        time: timeAgo(analysis.created_at),
        read: score >= 75,
        priority: score >= 80 ? "high" : score >= 60 ? "medium" : "low",
        icon: "file-text",
        color: score >= 80 ? "text-emerald-500" : score >= 60 ? "text-yellow-500" : "text-red-500",
        source: "resume-analyses",
      });
    }

    const skills = Array.isArray(profile.skills)
      ? profile.skills
      : (() => {
          try {
            return profile.skills ? JSON.parse(profile.skills) : [];
          } catch {
            return [];
          }
        })();

    const projects = Array.isArray(profile.projects)
      ? profile.projects
      : (() => {
          try {
            return profile.projects ? JSON.parse(profile.projects) : [];
          } catch {
            return [];
          }
        })();

    const certifications = Array.isArray(profile.certifications)
      ? profile.certifications
      : (() => {
          try {
            return profile.certifications ? JSON.parse(profile.certifications) : [];
          } catch {
            return [];
          }
        })();

    const profileChecks: ProfileCheck[] = [
      {
        enabled: Boolean(profile.company || profile.designation),
        title: "Professional profile updated",
        message: `${profile.first_name || "Your"} profile is ready for employers.`,
        priority: "medium" as Priority,
        color: "text-purple-500",
      },
      {
        enabled: skills.length > 0,
        title: "Skills synced",
        message: `${skills.length} skills available in your profile.`,
        priority: (skills.length > 0 ? "low" : "medium") as Priority,
        color: "text-yellow-500",
      },
      {
        enabled: projects.length > 0,
        title: "Projects showcase available",
        message: `${projects.length} project${projects.length === 1 ? "" : "s"} added to your portfolio.`,
        priority: "low",
        color: "text-blue-500",
      },
      {
        enabled: certifications.length > 0,
        title: "Certifications added",
        message: `${certifications.length} certification${certifications.length === 1 ? "" : "s"} attached to your account.`,
        priority: "low",
        color: "text-emerald-500",
      },
    ];

    for (const item of profileChecks) {
      if (!item.enabled) continue;
      notifications.push({
        id: `profile-${item.title}`,
        type: "profile",
        title: item.title,
        message: item.message,
        time: timeAgo(profile.updated_at),
        read: false,
        priority: item.priority,
        icon: "sparkles",
        color: item.color,
        source: "profile",
      });
    }

    notifications.sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const;
      return priorityRank[a.priority] - priorityRank[b.priority] || a.time.localeCompare(b.time);
    });

    const unreadCount = notifications.filter((item) => !item.read).length;
    const stats = {
      total: notifications.length,
      unread: unreadCount,
      highPriority: notifications.filter((item) => item.priority === "high").length,
      applications: applicationRows?.length || 0,
      analyses: analysisRows?.length || 0,
    };

    return NextResponse.json({ success: true, data: notifications, stats });
  } catch (error) {
    console.error("[Professional Notifications] Error:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  } finally {
    connection.release();
  }
}
