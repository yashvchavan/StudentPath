/**
 * GET /api/platform-admin/feedback
 *
 * Returns all user feedback with aggregate stats for the platform admin dashboard.
 * Supports pagination and filtering by college.
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  isPlatformAdminAuthorized,
  platformAdminUnauthorizedResponse,
} from "@/lib/platform-admin";

export async function GET(request: NextRequest) {
  try {
    if (!isPlatformAdminAuthorized(request)) {
      return platformAdminUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const collegeFilter = searchParams.get("college_id");
    const offset = (page - 1) * limit;

    // Aggregate stats
    const whereClause = collegeFilter ? `WHERE f.college_id = ?` : "";
    const params: any[] = collegeFilter ? [parseInt(collegeFilter, 10)] : [];

    const [statsRows]: any = await pool.query(
      `SELECT 
        COUNT(*) as total_feedback,
        ROUND(AVG(overall_rating), 2) as avg_overall,
        ROUND(AVG(ease_of_use), 2) as avg_ease_of_use,
        ROUND(AVG(feature_usefulness), 2) as avg_feature_usefulness,
        ROUND(AVG(ai_quality), 2) as avg_ai_quality,
        ROUND(AVG(ui_design), 2) as avg_ui_design,
        ROUND(AVG(performance_rating), 2) as avg_performance,
        SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) as would_recommend_count,
        SUM(CASE WHEN would_recommend = 0 THEN 1 ELSE 0 END) as would_not_recommend_count
       FROM user_feedback f ${whereClause}`,
      params
    );

    const stats = statsRows[0] || {};

    // Most useful feature breakdown
    const [featureBreakdown]: any = await pool.query(
      `SELECT most_useful_feature, COUNT(*) as count 
       FROM user_feedback f ${whereClause}
       ${whereClause ? 'AND' : 'WHERE'} most_useful_feature IS NOT NULL
       GROUP BY most_useful_feature 
       ORDER BY count DESC`,
      params
    );

    // Rating distribution
    const [ratingDist]: any = await pool.query(
      `SELECT overall_rating, COUNT(*) as count 
       FROM user_feedback f ${whereClause}
       GROUP BY overall_rating 
       ORDER BY overall_rating DESC`,
      params
    );

    // Usage frequency breakdown
    const [usageBreakdown]: any = await pool.query(
      `SELECT how_often_use, COUNT(*) as count 
       FROM user_feedback f ${whereClause}
       ${whereClause ? 'AND' : 'WHERE'} how_often_use IS NOT NULL
       GROUP BY how_often_use 
       ORDER BY count DESC`,
      params
    );

    // Recent feedback entries with student info
    const [feedbackRows]: any = await pool.query(
      `SELECT f.*, 
        s.first_name, s.last_name, s.email, s.program,
        c.college_name
       FROM user_feedback f
       LEFT JOIN Students s ON f.student_id = s.student_id
       LEFT JOIN colleges c ON f.college_id = c.id
       ${collegeFilter ? `WHERE f.college_id = ${Number(parseInt(collegeFilter, 10))}` : ''}
       ORDER BY f.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
    );

    // Total count for pagination
    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM user_feedback f ${whereClause}`,
      params
    );
    const totalCount = countRows[0]?.total || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalFeedback: stats.total_feedback || 0,
        averageOverall: stats.avg_overall || 0,
        averageEaseOfUse: stats.avg_ease_of_use || 0,
        averageFeatureUsefulness: stats.avg_feature_usefulness || 0,
        averageAiQuality: stats.avg_ai_quality || 0,
        averageUiDesign: stats.avg_ui_design || 0,
        averagePerformance: stats.avg_performance || 0,
        wouldRecommendCount: stats.would_recommend_count || 0,
        wouldNotRecommendCount: stats.would_not_recommend_count || 0,
        recommendRate: stats.total_feedback > 0
          ? Math.round((stats.would_recommend_count / stats.total_feedback) * 100)
          : 0,
      },
      featureBreakdown,
      ratingDistribution: ratingDist,
      usageBreakdown,
      feedback: feedbackRows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("[Platform Admin Feedback] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback data" },
      { status: 500 }
    );
  }
}
