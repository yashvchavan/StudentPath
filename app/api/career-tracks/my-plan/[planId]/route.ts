/**
 * DELETE /api/career-tracks/my-plan/[planId]
 * GET    /api/career-tracks/my-plan/[planId]
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPlanWithTasks, getSkillRadarData, deletePlan } from "@/lib/career-tracks/gamification";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ planId: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planId } = await params;
        const planIdNum = parseInt(planId);
        if (isNaN(planIdNum)) {
            return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
        }

        const data = await getPlanWithTasks(planIdNum, Number(user.id));
        if (!data) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        const radarData = await getSkillRadarData(planIdNum);

        return NextResponse.json({
            success: true,
            data: {
                ...data,
                radarData,
            },
        });
    } catch (error: any) {
        console.error("Error fetching plan:", error);
        return NextResponse.json(
            { error: "Failed to fetch plan", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ planId: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planId } = await params;
        const planIdNum = parseInt(planId);
        if (isNaN(planIdNum)) {
            return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
        }

        const deleted = await deletePlan(planIdNum, Number(user.id));
        if (!deleted) {
            return NextResponse.json({ error: "Plan not found or already deleted" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Plan deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting plan:", error);
        return NextResponse.json(
            { error: "Failed to delete plan", details: error.message },
            { status: 500 }
        );
    }
}
