import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAuthUser } from "@/lib/auth"
import {
  DEFAULT_COLLEGE_FEATURE_FLAGS,
  ensureCollegeFeatureFlagsTable,
  parseFeatureFlags,
} from "@/lib/platform-admin"

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user || (user.role !== "college" && user.role !== "dept_tpo")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.college_id) {
      return NextResponse.json({ featureFlags: DEFAULT_COLLEGE_FEATURE_FLAGS })
    }

    await ensureCollegeFeatureFlagsTable()

    const [rows] = await pool.query(
      `SELECT feature_flags
       FROM college_feature_flags
       WHERE college_id = ?
       LIMIT 1`,
      [user.college_id]
    )

    const row = (rows as Array<{ feature_flags: unknown }>)[0]

    return NextResponse.json({
      featureFlags: row ? parseFeatureFlags(row.feature_flags) : DEFAULT_COLLEGE_FEATURE_FLAGS,
    })
  } catch (error) {
    console.error("[admin/feature-flags] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    )
  }
}
