import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export const PLATFORM_FEATURE_KEYS = [
  "student_registration",
  "internship_module",
  "placement_module",
  "ai_assistant",
  "career_tracks",
  "analytics_dashboard",
  "tpo_management",
  "notification_center",
] as const

export type PlatformFeatureKey = (typeof PLATFORM_FEATURE_KEYS)[number]
export type CollegeFeatureFlags = Record<PlatformFeatureKey, boolean>

export const DEFAULT_COLLEGE_FEATURE_FLAGS: CollegeFeatureFlags = {
  student_registration: true,
  internship_module: true,
  placement_module: true,
  ai_assistant: true,
  career_tracks: true,
  analytics_dashboard: true,
  tpo_management: true,
  notification_center: true,
}

function getPlatformAdminKey(): string {
  return (process.env.PLATFORM_ADMIN_KEY || "").trim()
}

export function isPlatformAdminAuthorized(request: NextRequest): boolean {
  const expectedKey = getPlatformAdminKey()
  const incomingKey = (request.headers.get("x-platform-admin-key") || "").trim()

  if (!expectedKey) {
    // If key is not configured, deny all requests to avoid accidental public access.
    return false
  }

  return incomingKey.length > 0 && incomingKey === expectedKey
}

export function platformAdminUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "Missing or invalid platform admin key. Configure PLATFORM_ADMIN_KEY and pass it via x-platform-admin-key.",
    },
    { status: 401 }
  )
}

export async function ensureCollegeFeatureFlagsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS college_feature_flags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      college_id INT NOT NULL,
      feature_flags JSON NOT NULL,
      updated_by VARCHAR(255) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_college_feature_flags (college_id),
      FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
    )
  `)
}

export function sanitizeFeatureFlags(
  input: Partial<Record<PlatformFeatureKey, unknown>>
): CollegeFeatureFlags {
  const nextFlags: CollegeFeatureFlags = { ...DEFAULT_COLLEGE_FEATURE_FLAGS }

  for (const feature of PLATFORM_FEATURE_KEYS) {
    const incomingValue = input[feature]
    if (typeof incomingValue === "boolean") {
      nextFlags[feature] = incomingValue
    }
  }

  return nextFlags
}

export function parseFeatureFlags(raw: unknown): CollegeFeatureFlags {
  if (!raw) {
    return { ...DEFAULT_COLLEGE_FEATURE_FLAGS }
  }

  if (typeof raw === "object") {
    return sanitizeFeatureFlags(raw as Partial<Record<PlatformFeatureKey, unknown>>)
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object") {
        return sanitizeFeatureFlags(parsed as Partial<Record<PlatformFeatureKey, unknown>>)
      }
    } catch {
      return { ...DEFAULT_COLLEGE_FEATURE_FLAGS }
    }
  }

  return { ...DEFAULT_COLLEGE_FEATURE_FLAGS }
}
