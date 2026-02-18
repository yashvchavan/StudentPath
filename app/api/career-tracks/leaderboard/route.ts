/**
 * GET /api/career-tracks/leaderboard
 *
 * Returns top 10 students by total XP across all career plans.
 * Also returns the current user's rank.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/career-tracks/gamification";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const leaderboard = await getLeaderboard(10);

        // Get current user's XP and rank
        const conn = await pool.getConnection();
        let myRank = null;
        let myXp = 0;
        try {
            const [myRows]: any = await conn.execute(
                `SELECT COALESCE(SUM(total_xp), 0) as total_xp FROM career_plans 
                 WHERE student_id = ? AND is_active = TRUE`,
                [user.id]
            );
            myXp = Number(myRows[0]?.total_xp) || 0;

            // Count how many students have more XP than me
            const [rankRows]: any = await conn.query(
                `SELECT COUNT(*) + 1 as my_rank
                 FROM (
                   SELECT student_id, SUM(total_xp) as total_xp
                   FROM career_plans WHERE is_active = TRUE
                   GROUP BY student_id
                 ) ranked
                 WHERE total_xp > ${myXp}`
            );
            myRank = Number(rankRows[0]?.my_rank) || 1;
        } finally {
            conn.release();
        }

        return NextResponse.json({
            success: true,
            data: {
                leaderboard,
                currentUser: {
                    student_id: user.id,
                    name: user.name,
                    total_xp: myXp,
                    rank: myRank,
                },
            },
        });
    } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard", details: error.message },
            { status: 500 }
        );
    }
}
