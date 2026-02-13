/**
 * POST /api/career-tracks/generate-plan
 *
 * Generates a personalized career preparation plan using ChatGPT.
 *
 * Flow:
 * 1. Receives student skills, target (company/exam), and time constraints.
 * 2. Builds a structured prompt using plan-generator utilities.
 * 3. Sends the prompt to OpenAI ChatGPT API.
 * 4. Parses the response into a structured plan format.
 * 5. Returns the plan to the frontend.
 *
 * Request body:
 * {
 *   trackType: "placement" | "higher-studies",
 *   targetId: string,
 *   targetName: string,
 *   requiredSkills: string[],
 *   studentSkills: Record<string, number>,
 *   semester: number,
 *   timeRemainingWeeks: number,
 *   additionalContext?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
    buildPlanPrompt,
    parsePlanResponse,
    type PlanRequest,
} from "@/lib/career-tracks/plan-generator";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const {
            trackType,
            targetId,
            targetName,
            requiredSkills,
            studentSkills,
            semester,
            timeRemainingWeeks,
            additionalContext,
        } = body;

        if (!trackType || !targetId || !targetName || !requiredSkills || !studentSkills) {
            return NextResponse.json(
                { error: "Missing required fields: trackType, targetId, targetName, requiredSkills, studentSkills" },
                { status: 400 }
            );
        }

        if (!["placement", "higher-studies"].includes(trackType)) {
            return NextResponse.json(
                { error: "trackType must be 'placement' or 'higher-studies'" },
                { status: 400 }
            );
        }

        // Build the plan request
        const planRequest: PlanRequest = {
            trackType,
            targetId,
            targetName,
            requiredSkills,
            studentSkills,
            semester: semester || 6,
            timeRemainingWeeks: timeRemainingWeeks || 12,
            additionalContext,
        };

        // Build the prompt
        const prompt = buildPlanPrompt(planRequest);

        // Call OpenAI ChatGPT API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert career counselor specializing in engineering student career guidance in India. You create detailed, actionable preparation plans. Always respond with valid JSON only.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 3000,
        });

        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            return NextResponse.json(
                { error: "No response from AI. Please try again." },
                { status: 500 }
            );
        }

        // Parse the response into a structured plan
        const plan = parsePlanResponse(responseContent, planRequest);

        return NextResponse.json({
            success: true,
            data: plan,
        });
    } catch (error: any) {
        console.error("Error generating plan:", error);

        // Handle OpenAI-specific errors
        if (error?.status === 429) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again in a moment." },
                { status: 429 }
            );
        }

        if (error?.status === 401) {
            return NextResponse.json(
                { error: "API key configuration error. Please contact support." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: "Failed to generate plan. Please try again.",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
