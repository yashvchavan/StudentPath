import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import {
  isPlatformAdminAuthorized,
  platformAdminUnauthorizedResponse,
} from "@/lib/platform-admin"

interface StatusBody {
  isActive?: boolean
  tokenActive?: boolean
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null

  try {
    if (!isPlatformAdminAuthorized(request)) {
      return platformAdminUnauthorizedResponse()
    }

    const { collegeId } = await params
    const numericCollegeId = Number(collegeId)

    if (!Number.isFinite(numericCollegeId) || numericCollegeId <= 0) {
      return NextResponse.json({ error: "Invalid college id" }, { status: 400 })
    }

    const body = (await request.json()) as StatusBody

    if (typeof body.isActive !== "boolean" && typeof body.tokenActive !== "boolean") {
      return NextResponse.json(
        { error: "Provide at least one field: isActive or tokenActive" },
        { status: 400 }
      )
    }

    connection = await pool.getConnection()
    await connection.beginTransaction()

    if (typeof body.isActive === "boolean") {
      await connection.execute(
        "UPDATE colleges SET is_active = ? WHERE id = ?",
        [body.isActive ? 1 : 0, numericCollegeId]
      )
    }

    if (typeof body.tokenActive === "boolean") {
      await connection.execute(
        "UPDATE college_tokens SET is_active = ? WHERE college_id = ?",
        [body.tokenActive ? 1 : 0, numericCollegeId]
      )
    }

    await connection.commit()

    const [rows] = await pool.query(
      `SELECT c.id, IF(c.is_active = TRUE, 1, 0) AS isActive,
              IF(COALESCE(ct.token_active, 1) = 1, 1, 0) AS tokenActive
       FROM colleges c
       LEFT JOIN (
         SELECT college_id, MAX(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS token_active
         FROM college_tokens
         GROUP BY college_id
       ) ct ON ct.college_id = c.id
       WHERE c.id = ?
       LIMIT 1`,
      [numericCollegeId]
    )

    const row = (rows as Array<{ id: number; isActive: number; tokenActive: number }>)[0]

    if (!row) {
      return NextResponse.json({ error: "College not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      collegeId: row.id,
      isActive: row.isActive === 1,
      tokenActive: row.tokenActive === 1,
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }

    console.error("[platform-admin/status] Error:", error)
    return NextResponse.json(
      { error: "Failed to update college status" },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
