import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/college/departments?token=<college_token>
 * Public endpoint — no auth required (used during student registration).
 * Returns the list of active departments for a college identified by token.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "College token is required" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      // Resolve college from token
      const [colleges]: any = await connection.execute(
        `SELECT c.id FROM colleges c
         JOIN college_tokens ct ON c.id = ct.college_id
         WHERE ct.token = ? AND ct.is_active = TRUE AND c.is_active = TRUE
         LIMIT 1`,
        [token]
      );

      if (!colleges || colleges.length === 0) {
        return NextResponse.json({ error: "Invalid college token" }, { status: 404 });
      }

      const collegeId = colleges[0].id;

      // Fetch active departments
      const [departments]: any = await connection.execute(
        `SELECT id, name, code FROM departments
         WHERE college_id = ? AND is_active = TRUE
         ORDER BY name ASC`,
        [collegeId]
      );

      return NextResponse.json({
        success: true,
        departments: departments.map((d: any) => ({
          id:   d.id,
          name: d.name,
          code: d.code,
        })),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[GET /api/college/departments] Error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
