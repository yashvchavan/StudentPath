import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/internships/[id]/apply — check if student has applied
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            const studentId = parseInt(String(user.id));

            const [rows]: any = await connection.execute(
                "SELECT id, status, applied_at FROM internship_applications WHERE internship_id = ? AND student_id = ? LIMIT 1",
                [parseInt(id), studentId]
            );

            return NextResponse.json({
                success: true,
                hasApplied: rows.length > 0,
                application: rows[0] || null,
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[GET /api/internships/[id]/apply]", error);
        return NextResponse.json({ error: "Failed to check application" }, { status: 500 });
    }
}

// POST /api/internships/[id]/apply — apply for an internship
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { cover_letter } = body;

        const connection = await pool.getConnection();
        try {
            const studentId = parseInt(String(user.id));

            // Check if internship exists and is active
            const [internRows]: any = await connection.execute(
                "SELECT id, application_deadline FROM internships WHERE id = ? AND is_active = TRUE LIMIT 1",
                [parseInt(id)]
            );

            if (internRows.length === 0) {
                return NextResponse.json({ error: "Internship not found or closed" }, { status: 404 });
            }

            const deadline = internRows[0].application_deadline;
            if (deadline && new Date(deadline) < new Date()) {
                return NextResponse.json({ error: "Application deadline has passed" }, { status: 400 });
            }

            // Check for duplicate application
            const [existing]: any = await connection.execute(
                "SELECT id FROM internship_applications WHERE internship_id = ? AND student_id = ? LIMIT 1",
                [parseInt(id), studentId]
            );

            if (existing.length > 0) {
                return NextResponse.json({ error: "You have already applied for this internship" }, { status: 409 });
            }

            await connection.execute(
                "INSERT INTO internship_applications (internship_id, student_id, cover_letter) VALUES (?, ?, ?)",
                [parseInt(id), studentId, cover_letter || null]
            );

            return NextResponse.json({ success: true, message: "Application submitted successfully" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[POST /api/internships/[id]/apply]", error);
        return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
    }
}
