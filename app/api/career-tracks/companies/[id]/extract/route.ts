import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { extractFromMultipleReviews } from "@/lib/ai-extraction";
import { getReviewsForAI, updateAIExtractedData } from "@/lib/placementRepository";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        // Fetch all reviews for this placement
        const reviews = await getReviewsForAI(placementId);
        console.log(`[AI Extract] Found ${reviews.length} reviews for placement ${placementId}`);

        if (reviews.length === 0) {
            return NextResponse.json(
                { error: "No reviews available for extraction" },
                { status: 400 }
            );
        }

        // Format reviews for AI extraction
        const formattedReviews = reviews.map((r: any) => ({
            rating: r.rating,
            comment: r.comment || "",
            interviewExperience: r.interview_experience || "",
            questionsAsked: r.questions_asked || "",
            preparationTips: r.preparation_tips || "",
            overallExperience: r.overall_experience || "",
        }));

        console.log(`[AI Extract] Formatted ${formattedReviews.length} reviews for AI`);

        // Extract data using AI
        const extractedData = await extractFromMultipleReviews(formattedReviews);
        console.log(`[AI Extract] Extraction complete:`, {
            skills: extractedData.skills.length,
            rounds: extractedData.rounds.length,
            difficulty: extractedData.difficultyLevel,
            confidence: extractedData.confidenceScore
        });

        // Update placement record
        await updateAIExtractedData(placementId, {
            extracted_skills: extractedData.skills,
            extracted_rounds: extractedData.rounds,
            difficulty_level: extractedData.difficultyLevel,
            total_rounds: extractedData.totalRounds,
            ai_confidence_score: extractedData.confidenceScore,
        });

        console.log(`[AI Extract] Database updated successfully for placement ${placementId}`);

        return NextResponse.json({
            success: true,
            data: extractedData,
            message: "AI extraction completed successfully",
        });
    } catch (error) {
        console.error("Error in AI extraction:", error);
        return NextResponse.json(
            { error: "Failed to extract data", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
