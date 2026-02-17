import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15+ param handling
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const placementId = parseInt(id);


        if (isNaN(placementId)) {
            return NextResponse.json({ error: "Invalid placement ID" }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Fetch reviews with student names and profile info
            // Using LEFT JOIN so reviews display even if student record is missing
            const [rows]: any = await connection.execute(`
                SELECT 
                    pr.*, 
                    COALESCE(s.first_name, 'Student') as first_name, 
                    COALESCE(s.last_name, CAST(pr.student_id AS CHAR)) as last_name, 
                    s.current_year,
                    s.program,
                    s.email
                FROM placement_reviews pr
                LEFT JOIN Students s ON pr.student_id = s.student_id
                WHERE pr.placement_id = ?
                ORDER BY pr.created_at DESC
            `, [placementId]);

            return NextResponse.json({ success: true, data: rows });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const placementId = parseInt(id);

        if (isNaN(placementId)) {
            return NextResponse.json({ error: "Invalid placement ID" }, { status: 400 });
        }

        const body = await req.json();
        const {
            rating,
            comment,
            anonymous,
            interviewDate,
            offerReceived,
            salaryOffered,
            interviewExperience,
            questionsAsked,
            preparationTips,
            overallExperience,
            wouldRecommend,
            roundsCleared
        } = body;

        if (!rating || !comment) {
            return NextResponse.json({ error: "Rating and comment are required" }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Insert comprehensive review
            await connection.execute(`
                INSERT INTO placement_reviews (
                    placement_id, student_id, rating, comment, is_anonymous,
                    interview_date, offer_received, salary_offered,
                    interview_experience, questions_asked, preparation_tips,
                    overall_experience, would_recommend, rounds_cleared
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             `, [
                placementId,
                user.id,
                rating,
                comment,
                anonymous ? 1 : 0,
                interviewDate || null,
                offerReceived !== undefined ? (offerReceived ? 1 : 0) : null,
                salaryOffered || null,
                interviewExperience || null,
                questionsAsked || null,
                preparationTips || null,
                overallExperience || null,
                wouldRecommend !== undefined ? (wouldRecommend ? 1 : 0) : null,
                roundsCleared || null
            ]);

            // Trigger AI extraction in background (don't wait for it)
            // We'll do this asynchronously to not block the response
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/career-tracks/companies/${placementId}/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).catch(err => console.error('Background AI extraction failed:', err));

            return NextResponse.json({ success: true, message: "Review added successfully" });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error adding review:", error);
        return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const reviewId = parseInt(searchParams.get("reviewId") || "");

        if (isNaN(reviewId)) {
            return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Verify the review belongs to the current user
            const [rows]: any = await connection.execute(
                `SELECT id, student_id FROM placement_reviews WHERE id = ?`,
                [reviewId]
            );

            if (rows.length === 0) {
                return NextResponse.json({ error: "Review not found" }, { status: 404 });
            }

            if (rows[0].student_id !== parseInt(String(user.id))) {
                return NextResponse.json({ error: "You can only delete your own reviews" }, { status: 403 });
            }

            await connection.execute(
                `DELETE FROM placement_reviews WHERE id = ?`,
                [reviewId]
            );

            return NextResponse.json({ success: true, message: "Review deleted successfully" });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
