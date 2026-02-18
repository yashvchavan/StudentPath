/**
 * GET /api/career-tracks/my-plan/list
 *
 * Returns all active career plans for the authenticated student.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStudentPlans } from "@/lib/career-tracks/gamification";
import { initializeDatabase } from "@/lib/db";

// Lazy init — ensures tables exist even if instrumentation didn't run
let dbReady = false;
async function ensureDb() {
    if (!dbReady) {
        await initializeDatabase();
        dbReady = true;
    }
}

export async function GET(request: NextRequest) {
    try {
        await ensureDb();

        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const plans = await getStudentPlans(Number(user.id));

        return NextResponse.json({ success: true, data: plans });
    } catch (error: any) {
        console.error("Error fetching plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch plans", details: error.message },
            { status: 500 }
        );
    }
}
