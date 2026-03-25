import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import {
  ensureCollegeFeatureFlagsTable,
  isPlatformAdminAuthorized,
  parseFeatureFlags,
  platformAdminUnauthorizedResponse,
  sanitizeFeatureFlags,
  type CollegeFeatureFlags,
} from "@/lib/platform-admin"

interface FeaturesBody {
  featureFlags?: Partial<CollegeFeatureFlags>
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    if (!isPlatformAdminAuthorized(request)) {
      return platformAdminUnauthorizedResponse()
    }

    const { collegeId } = await params
    const numericCollegeId = Number(collegeId)

    if (!Number.isFinite(numericCollegeId) || numericCollegeId <= 0) {
      return NextResponse.json({ error: "Invalid college id" }, { status: 400 })
    }

    const body = (await request.json()) as FeaturesBody

    if (!body.featureFlags || typeof body.featureFlags !== "object") {
      return NextResponse.json({ error: "featureFlags object is required" }, { status: 400 })
    }

    await ensureCollegeFeatureFlagsTable()

    const sanitizedFlags = sanitizeFeatureFlags(body.featureFlags)
    const actor = (request.headers.get("x-platform-admin-actor") || "system").slice(0, 255)

    await pool.execute(
      `INSERT INTO college_feature_flags (college_id, feature_flags, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         feature_flags = VALUES(feature_flags),
         updated_by = VALUES(updated_by),
         updated_at = CURRENT_TIMESTAMP`,
      [numericCollegeId, JSON.stringify(sanitizedFlags), actor]
    )

    const [rows] = await pool.query(
      `SELECT feature_flags
       FROM college_feature_flags
       WHERE college_id = ?
       LIMIT 1`,
      [numericCollegeId]
    )

    const row = (rows as Array<{ feature_flags: unknown }>)[0]

    return NextResponse.json({
      success: true,
      collegeId: numericCollegeId,
      featureFlags: parseFeatureFlags(row?.feature_flags),
    })
  } catch (error) {
    console.error("[platform-admin/features] Error:", error)
    return NextResponse.json(
      { error: "Failed to update college feature flags" },
      { status: 500 }
    )
  }
}
