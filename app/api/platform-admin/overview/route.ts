import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import {
  ensureCollegeFeatureFlagsTable,
  isPlatformAdminAuthorized,
  parseFeatureFlags,
  platformAdminUnauthorizedResponse,
} from "@/lib/platform-admin"

interface CollegeAggregateRow {
  id: number
  collegeName: string
  email: string
  city: string | null
  state: string | null
  country: string | null
  isActive: number
  tokenActive: number
  totalStudents: number
  activeStudents: number
  freeStudents: number
  trialStudents: number
  proStudents: number
}

interface CollegeFeatureRow {
  college_id: number
  feature_flags: unknown
}

export async function GET(request: NextRequest) {
  try {
    if (!isPlatformAdminAuthorized(request)) {
      return platformAdminUnauthorizedResponse()
    }

    await ensureCollegeFeatureFlagsTable()

    const [aggregateRows] = await pool.query(
      `SELECT
          c.id,
          c.college_name AS collegeName,
          c.email,
          c.city,
          c.state,
          c.country,
          IF(c.is_active = TRUE, 1, 0) AS isActive,
          IF(COALESCE(ct.token_active, 1) = 1, 1, 0) AS tokenActive,
          COUNT(s.student_id) AS totalStudents,
          SUM(CASE WHEN s.is_active = TRUE THEN 1 ELSE 0 END) AS activeStudents,
          SUM(
            CASE
              WHEN s.student_id IS NULL THEN 0
              WHEN ls.id IS NULL THEN 1
              WHEN ls.plan = 'free' THEN 1
              WHEN ls.status = 'trialing' AND (ls.current_period_end IS NULL OR ls.current_period_end <= NOW()) THEN 1
              WHEN ls.plan = 'pro' AND (ls.status <> 'active' OR ls.current_period_end IS NULL OR ls.current_period_end <= NOW()) THEN 1
              ELSE 0
            END
          ) AS freeStudents,
          SUM(
            CASE
              WHEN s.student_id IS NULL THEN 0
              WHEN ls.status = 'trialing' AND ls.current_period_end > NOW() THEN 1
              ELSE 0
            END
          ) AS trialStudents,
          SUM(
            CASE
              WHEN s.student_id IS NULL THEN 0
              WHEN ls.plan = 'pro' AND ls.status = 'active' AND ls.current_period_end > NOW() THEN 1
              ELSE 0
            END
          ) AS proStudents
       FROM colleges c
       LEFT JOIN Students s ON s.college_id = c.id
       LEFT JOIN (
          SELECT s1.*
          FROM subscriptions s1
          INNER JOIN (
            SELECT student_id, MAX(id) AS max_id
            FROM subscriptions
            GROUP BY student_id
          ) s2 ON s1.id = s2.max_id
       ) ls ON ls.student_id = s.student_id
       LEFT JOIN (
          SELECT college_id, MAX(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS token_active
          FROM college_tokens
          GROUP BY college_id
       ) ct ON ct.college_id = c.id
       GROUP BY c.id, c.college_name, c.email, c.city, c.state, c.country, c.is_active, ct.token_active
       ORDER BY c.created_at DESC`
    )

    const rows = aggregateRows as CollegeAggregateRow[]
    const collegeIds = rows.map((row) => row.id)

    let featureMap = new Map<number, ReturnType<typeof parseFeatureFlags>>()

    if (collegeIds.length > 0) {
      const placeholders = collegeIds.map(() => "?").join(",")
      const [featureRows] = await pool.query(
        `SELECT college_id, feature_flags
         FROM college_feature_flags
         WHERE college_id IN (${placeholders})`,
        collegeIds
      )

      featureMap = new Map(
        (featureRows as CollegeFeatureRow[]).map((row) => [
          row.college_id,
          parseFeatureFlags(row.feature_flags),
        ])
      )
    }

    const proPlanPrice = Number(process.env.PLATFORM_PRO_PLAN_MONTHLY_PRICE || "999")

    const metrics = rows.reduce(
      (acc, row) => {
        acc.totalColleges += 1
        acc.activeColleges += row.isActive === 1 ? 1 : 0
        acc.totalStudents += Number(row.totalStudents || 0)
        acc.activeStudents += Number(row.activeStudents || 0)
        acc.freeStudents += Number(row.freeStudents || 0)
        acc.trialStudents += Number(row.trialStudents || 0)
        acc.proStudents += Number(row.proStudents || 0)
        return acc
      },
      {
        totalColleges: 0,
        activeColleges: 0,
        totalStudents: 0,
        activeStudents: 0,
        freeStudents: 0,
        trialStudents: 0,
        proStudents: 0,
      }
    )

    const monthlyRecurringRevenue = metrics.proStudents * proPlanPrice
    const annualRecurringRevenue = monthlyRecurringRevenue * 12
    const trialPipelineValue = metrics.trialStudents * proPlanPrice

    const colleges = rows.map((row) => {
      const totalStudents = Number(row.totalStudents || 0)
      const activeStudents = Number(row.activeStudents || 0)
      const proStudents = Number(row.proStudents || 0)
      const trialStudents = Number(row.trialStudents || 0)

      return {
        id: row.id,
        name: row.collegeName,
        email: row.email,
        location: [row.city, row.state, row.country].filter(Boolean).join(", "),
        isActive: row.isActive === 1,
        tokenActive: row.tokenActive === 1,
        totalStudents,
        activeStudents,
        freeStudents: Number(row.freeStudents || 0),
        trialStudents,
        proStudents,
        activationRate: totalStudents > 0 ? Number(((activeStudents / totalStudents) * 100).toFixed(1)) : 0,
        proAdoptionRate: totalStudents > 0 ? Number(((proStudents / totalStudents) * 100).toFixed(1)) : 0,
        monthlyRevenueEstimate: proStudents * proPlanPrice,
        trialPipelineValue: trialStudents * proPlanPrice,
        features: featureMap.get(row.id) ?? parseFeatureFlags(null),
      }
    })

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      proPlanMonthlyPrice: proPlanPrice,
      metrics: {
        ...metrics,
        monthlyRecurringRevenue,
        annualRecurringRevenue,
        trialPipelineValue,
      },
      colleges,
    })
  } catch (error) {
    console.error("[platform-admin/overview] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch platform admin overview" },
      { status: 500 }
    )
  }
}
