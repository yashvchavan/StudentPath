/**
 * POST /api/career-tracks/my-plan/add
 *
 * Saves a GPT-generated plan to the database and seeds tasks.
 * This is called when the user clicks "Add This Plan".
 *
 * Body:
 * {
 *   targetId: string,
 *   targetName: string,
 *   trackType: "placement" | "higher-studies",
 *   milestones: MilestoneInput[],
 *   difficulty?: "easy" | "medium" | "hard"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool, { initializeDatabase } from "@/lib/db";
import { seedTasksFromMilestones, type MilestoneInput } from "@/lib/career-tracks/gamification";

// Ensure tables exist (lazy init safety net)
let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await initializeDatabase();
        dbInitialized = true;
    }
}


export async function POST(request: NextRequest) {
    try {
        await ensureDb();

        const user = await getAuthUser();

        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const studentId = Number(user.id);
        const body = await request.json();
        const { targetId, targetName, trackType, milestones, difficulty = "medium" } = body;

        if (!targetId || !targetName || !milestones?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const conn = await pool.getConnection();
        try {
            // Check if plan already exists for this student + target
            const [existing]: any = await conn.execute(
                "SELECT id FROM career_plans WHERE student_id = ? AND target_id = ?",
                [studentId, targetId]
            );

            let planId: number;

            if (existing.length > 0) {
                // Plan already exists — return it
                planId = existing[0].id;
                return NextResponse.json({
                    success: true,
                    planId,
                    message: "Plan already exists",
                    alreadyExists: true,
                });
            }

            // Insert new plan — explicitly set is_active=1 (don't rely on default)
            const [result]: any = await conn.execute(
                `INSERT INTO career_plans 
                 (student_id, target_id, target_name, track_type, difficulty_level, is_active)
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [studentId, targetId, targetName, trackType || "placement", difficulty]
            );
            planId = result.insertId;

            // Seed tasks from milestones
            await seedTasksFromMilestones(planId, milestones as MilestoneInput[], difficulty);

            return NextResponse.json({
                success: true,
                planId,
                message: "Plan added successfully",
                alreadyExists: false,
            });
        } finally {
            conn.release();
        }
    } catch (error: any) {
        console.error("Error adding plan:", error);
        return NextResponse.json(
            { error: "Failed to add plan", details: error.message },
            { status: 500 }
        );
    }
}
