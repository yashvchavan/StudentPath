import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// PATCH /api/admin/internships/[id]/applications/[appId] — update application status
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; appId: string }> }
) {
    const { id, appId } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "college" || !user.college_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = body;

        const validStatuses = ["applied", "under_review", "shortlisted", "rejected", "selected"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Verify internship belongs to this college
            const [check]: any = await connection.execute(
                `SELECT i.id FROM internship_applications ia
                 JOIN internships i ON i.id = ia.internship_id
                 WHERE ia.id = ? AND i.id = ? AND i.college_id = ? LIMIT 1`,
                [parseInt(appId), parseInt(id), user.college_id]
            );
            if (check.length === 0) {
                return NextResponse.json({ error: "Application not found" }, { status: 404 });
            }

            await connection.execute(
                "UPDATE internship_applications SET status = ? WHERE id = ?",
                [status, parseInt(appId)]
            );

            return NextResponse.json({ success: true, message: "Application status updated" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[PATCH /api/admin/internships/[id]/applications/[appId]]", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
