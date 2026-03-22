/**
 * API Route: POST /api/integrations/github-analyze
 *
 * Analyzes the GitHub profile of a student.
 *
 * Request body (JSON):
 *   { studentId: number }          — looks up github_username from DB
 *   OR
 *   { githubUsername: string }      — direct use, no DB lookup
 *
 * Response (JSON):
 *   { success: true, data: GitHubAnalysisResult }
 *   | { error: string }
 */
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  analyzeGitHubProfile,
  RateLimitError,
  NotFoundError,
  type GitHubAnalysisResult,
} from "@/lib/integrations/githubAnalyzer";

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    const { studentId, githubUsername: directUsername } = body as {
      studentId?: number;
      githubUsername?: string;
    };

    // ── Resolve the GitHub username ─────────────────────────────────────────
    let username: string | null = null;

    if (directUsername) {
      // Caller passed username directly — use it as-is
      username = directUsername.trim();
    } else if (studentId) {
      // Look up the student record to get their stored github_username
      connection = await pool.getConnection();
      const [rows] = await connection.execute<any[]>(
        "SELECT github_username FROM Students WHERE student_id = ? AND is_active = TRUE LIMIT 1",
        [studentId]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "Student not found." },
          { status: 404 }
        );
      }
      username = rows[0]?.github_username ?? null;
    }

    if (!username) {
      return NextResponse.json(
        {
          error:
            "No GitHub username available. Provide `githubUsername` or a `studentId` with a linked GitHub account.",
        },
        { status: 400 }
      );
    }

    // ── Run the analysis ────────────────────────────────────────────────────
    const result: GitHubAnalysisResult = await analyzeGitHubProfile(username);

    // ── Optionally persist skills back to the student record ────────────────
    if (studentId && connection) {
      const merged = [
        ...result.skillProfile.skills,
        ...result.skillProfile.frameworks,
        ...result.skillProfile.tools,
      ];

      await connection.execute(
        `UPDATE Students
         SET technical_skills = JSON_SET(
               COALESCE(technical_skills, '{}'),
               '$.github_analyzed', CAST(? AS JSON)
             ),
             updated_at = NOW()
         WHERE student_id = ?`,
        [JSON.stringify(merged), studentId]
      );
    }

    return NextResponse.json({ success: true, data: result });

  } catch (err) {
    // Typed error handling
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message },
        { status: 429 }
      );
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: `GitHub user not found: ${err.message}` },
        { status: 404 }
      );
    }
    console.error("[API /api/integrations/github-analyze]", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ─── GET — quick lookup by query param ────────────────────────────────────────
// Usage: GET /api/integrations/github-analyze?username=torvalds
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json(
      { error: "Query parameter `username` is required." },
      { status: 400 }
    );
  }
  try {
    const result = await analyzeGitHubProfile(username);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: `GitHub user not found: ${username}` },
        { status: 404 }
      );
    }
    console.error("[API GET /api/integrations/github-analyze]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
