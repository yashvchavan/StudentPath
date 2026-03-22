/**
 * API Route: /api/integrations/leetcode-analyze
 *
 * POST body (JSON):
 *   { studentId: number }          — looks up leetcode_username from DB
 *   OR
 *   { leetcodeUsername: string }   — direct use, no DB lookup
 *
 * GET query param:
 *   ?username=john_doe
 *
 * Response:
 *   { success: true, data: LeetCodeAnalysisResult }
 *   | { error: string }
 */
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  analyzeLeetCodeProfile,
  LeetCodeUserNotFoundError,
  LeetCodeRateLimitError,
  type LeetCodeAnalysisResult,
} from "@/lib/integrations/leetcodeAnalyzer";

// ─── Shared handler logic ─────────────────────────────────────────────────────

async function runAnalysis(username: string, studentId?: number) {
  const result: LeetCodeAnalysisResult = await analyzeLeetCodeProfile(username);

  // Optionally persist the DSA profile back to the student record
  if (studentId) {
    let connection;
    try {
      connection = await pool.getConnection();
      const profile = result.dsaProfile;

      await connection.execute(
        `UPDATE Students
         SET technical_skills = JSON_SET(
               COALESCE(technical_skills, '{}'),
               '$.leetcode_dsa',     CAST(? AS JSON),
               '$.leetcode_level',   ?,
               '$.leetcode_solved',  ?
             ),
             updated_at = NOW()
         WHERE student_id = ?`,
        [
          JSON.stringify({
            topics: profile.topics,
            contestRating: profile.contestRating,
          }),
          profile.level,
          profile.solved,
          studentId,
        ]
      );
    } catch (dbErr) {
      // Non-fatal — log and continue; analysis result is still returned
      console.error("[LeetCode API] Failed to persist DSA profile:", dbErr);
    } finally {
      if (connection) connection.release();
    }
  }

  return result;
}

// ─── POST /api/integrations/leetcode-analyze ─────────────────────────────────

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    const { studentId, leetcodeUsername: directUsername } = body as {
      studentId?: number;
      leetcodeUsername?: string;
    };

    let username: string | null = null;

    if (directUsername) {
      username = directUsername.trim();
    } else if (studentId) {
      connection = await pool.getConnection();
      const [rows] = await connection.execute<any[]>(
        "SELECT leetcode_username FROM Students WHERE student_id = ? AND is_active = TRUE LIMIT 1",
        [studentId]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }
      username = rows[0]?.leetcode_username ?? null;
    }

    if (!username) {
      return NextResponse.json(
        {
          error:
            "No LeetCode username available. Provide `leetcodeUsername` or a `studentId` with a linked LeetCode account.",
        },
        { status: 400 }
      );
    }

    const result = await runAnalysis(username, studentId);
    return NextResponse.json({ success: true, data: result });

  } catch (err) {
    if (err instanceof LeetCodeUserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof LeetCodeRateLimitError) {
      return NextResponse.json(
        { error: err.message, retryAfter: err.retryAfter },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfter) },
        }
      );
    }
    console.error("[POST /api/integrations/leetcode-analyze]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// ─── GET /api/integrations/leetcode-analyze?username=john_doe ────────────────

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Query parameter `username` is required." },
      { status: 400 }
    );
  }

  try {
    const result = await runAnalysis(username.trim());
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof LeetCodeUserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof LeetCodeRateLimitError) {
      return NextResponse.json(
        { error: err.message, retryAfter: err.retryAfter },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfter) },
        }
      );
    }
    console.error("[GET /api/integrations/leetcode-analyze]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
