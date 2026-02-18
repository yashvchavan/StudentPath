/**
 * POST /api/career-tracks/my-plan/complete-task
 *
 * Marks a task as complete, updates XP, streak, progress, and checks rewards.
 *
 * Body: { taskId: number, planId: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { completeTask } from "@/lib/career-tracks/gamification";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { taskId, planId } = await request.json();

        if (!taskId || !planId) {
            return NextResponse.json({ error: "taskId and planId are required" }, { status: 400 });
        }

        const result = await completeTask(
            Number(taskId),
            Number(planId),
            Number(user.id)
        );

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("Error completing task:", error);
        return NextResponse.json(
            { error: error.message || "Failed to complete task" },
            { status: 500 }
        );
    }
}
