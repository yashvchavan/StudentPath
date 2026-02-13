/**
 * GET /api/career-tracks/exams
 *
 * Returns the list of competitive exams for the higher studies track.
 *
 * ARCHITECTURE NOTE:
 * Currently serves static data from lib/career-tracks/exams.ts.
 * In production, this data will be extracted from admin-uploaded documents/sheets
 * and stored in the DB. Only the data source changes; response shape stays the same.
 *
 * Query params:
 *   - id: string (return a specific exam by ID)
 *   - category: "Engineering" | "Management" | "General" (filter)
 */

import { NextRequest, NextResponse } from "next/server";
import { competitiveExams } from "@/lib/career-tracks/exams";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const category = searchParams.get("category");

        // ── Exam Data ─────────────────────────────────────────────────────────
        // TODO: Replace with DB query once admin document upload + extraction is implemented.
        // Example future query: SELECT * FROM competitive_exams WHERE is_active = TRUE
        let exams = [...competitiveExams];

        // Filter by specific exam ID
        if (id) {
            const exam = exams.find((e) => e.id === id);
            if (!exam) {
                return NextResponse.json(
                    { error: "Exam not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                data: exam,
            });
        }

        // Filter by category
        if (category) {
            exams = exams.filter((e) => e.category === category);
        }

        return NextResponse.json({
            success: true,
            data: exams,
        });
    } catch (error) {
        console.error("Error fetching exams:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
