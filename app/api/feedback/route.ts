/**
 * POST /api/feedback — Submit user feedback
 * GET  /api/feedback — Check if user can submit feedback (no cooldown, always allowed)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get previous feedback count
    const [rows]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM user_feedback WHERE student_id = ?`,
      [user.id]
    );

    const feedbackCount = rows?.[0]?.count || 0;

    // Get the last feedback date
    const [lastRows]: any = await pool.execute(
      `SELECT created_at FROM user_feedback WHERE student_id = ? ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      canSubmit: true, // Always allowed
      feedbackCount,
      lastFeedbackDate: lastRows?.[0]?.created_at || null,
    });
  } catch (error) {
    console.error("[Feedback GET] Error:", error);
    return NextResponse.json({ error: "Failed to check feedback status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      overall_rating,
      ease_of_use,
      feature_usefulness,
      ai_quality,
      ui_design,
      performance_rating,
      would_recommend,
      most_useful_feature,
      least_useful_feature,
      missing_feature,
      improvement_suggestion,
      best_thing,
      how_often_use,
      additional_comments,
    } = body;

    // Validate required field
    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json(
        { error: "Overall rating is required (1-5)" },
        { status: 400 }
      );
    }

    // Get student's college_id
    let collegeId = null;
    try {
      const [studentRows]: any = await pool.execute(
        `SELECT college_id FROM Students WHERE student_id = ? LIMIT 1`,
        [user.id]
      );
      if (studentRows && studentRows.length > 0) {
        collegeId = studentRows[0].college_id;
      }
    } catch { /* ignore */ }

    await pool.execute(
      `INSERT INTO user_feedback 
       (student_id, college_id, overall_rating, ease_of_use, feature_usefulness,
        ai_quality, ui_design, performance_rating, would_recommend, 
        most_useful_feature, least_useful_feature, missing_feature,
        improvement_suggestion, best_thing, how_often_use, additional_comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        collegeId,
        overall_rating,
        ease_of_use || null,
        feature_usefulness || null,
        ai_quality || null,
        ui_design || null,
        performance_rating || null,
        would_recommend !== undefined ? (would_recommend ? 1 : 0) : null,
        most_useful_feature || null,
        least_useful_feature || null,
        missing_feature || null,
        improvement_suggestion || null,
        best_thing || null,
        how_often_use || null,
        additional_comments || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback! Your input helps us improve StudentPath.",
    });
  } catch (error) {
    console.error("[Feedback POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
