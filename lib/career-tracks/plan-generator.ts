/**
 * plan-generator.ts — Prompt builder + plan parsing for ChatGPT-powered plan generation.
 *
 * ARCHITECTURE:
 * 1. Builds a structured prompt with student's current skills vs required skills.
 * 2. The prompt is sent to the OpenAI API in the API route.
 * 3. The response is parsed into a structured plan format.
 *
 * This file provides the prompt-building and response-parsing utilities.
 * The actual OpenAI call happens in the API route (app/api/career-tracks/generate-plan/route.ts).
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface PlanMilestone {
    week: number;
    title: string;
    tasks: string[];
    resources: string[];
    targetSkills: string[];
}

export interface GeneratedPlan {
    trackType: "placement" | "higher-studies";
    targetName: string;
    totalWeeks: number;
    summary: string;
    skillGaps: { skill: string; current: number; required: number }[];
    milestones: PlanMilestone[];
    dailySchedule: string;
    tips: string[];
}

export interface PlanRequest {
    trackType: "placement" | "higher-studies";
    targetId: string;
    targetName: string;
    requiredSkills: string[];
    studentSkills: Record<string, number>;  // skill name → proficiency (1-5)
    semester: number;
    timeRemainingWeeks: number;
    additionalContext?: string;             // e.g., exam-specific info
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

/**
 * Builds a structured prompt for ChatGPT to generate a personalized career plan.
 * The prompt includes:
 * - Student's current skill levels
 * - Required skills for the target (company or exam)
 * - Skill gap analysis
 * - Time constraints
 * - Specific instructions for plan format
 */
export function buildPlanPrompt(request: PlanRequest): string {
    // Analyze skill gaps
    const skillGapAnalysis = request.requiredSkills.map((skill) => {
        const current = request.studentSkills[skill] || 0;
        const gap = 5 - current; // Max proficiency is 5
        return `- ${skill}: Current Level ${current}/5, Gap: ${gap > 0 ? gap : 0} levels`;
    });

    // Skills the student has but aren't required
    const bonusSkills = Object.entries(request.studentSkills)
        .filter(([skill]) => !request.requiredSkills.includes(skill))
        .map(([skill, level]) => `- ${skill}: Level ${level}/5`);

    const isPlacement = request.trackType === "placement";

    const prompt = `You are an expert career counselor and study planner for engineering students in India.

A student needs a personalized ${isPlacement ? "placement preparation" : "exam preparation"} plan.

## Student Profile
- Current Semester: ${request.semester}
- Time Available: ${request.timeRemainingWeeks} weeks
- ${isPlacement ? `Target Company: ${request.targetName}` : `Target Exam: ${request.targetName}`}

## Skill Gap Analysis
Required skills and current proficiency (scale 1-5):
${skillGapAnalysis.join("\n")}

${bonusSkills.length > 0 ? `## Bonus Skills (student already has)\n${bonusSkills.join("\n")}` : ""}

${request.additionalContext ? `## Additional Context\n${request.additionalContext}` : ""}

## Instructions
Generate a detailed ${request.timeRemainingWeeks}-week preparation plan in the following JSON format. 
Be very specific with tasks and resources. Include real resource names (websites, books, platforms).

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief 2-3 sentence overview of the plan",
  "milestones": [
    {
      "week": 1,
      "title": "Week title/theme",
      "tasks": ["Specific task 1", "Specific task 2", "Specific task 3"],
      "resources": ["Resource name/link 1", "Resource name/link 2"],
      "targetSkills": ["Skill being developed"]
    }
  ],
  "dailySchedule": "Recommended daily study schedule (e.g., '2 hours morning DSA + 1 hour evening practice')",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}

Important rules:
- Each week should have 3-5 specific, actionable tasks
- Include real resource names (LeetCode, GeeksforGeeks, specific book names, YouTube channels etc.)
- Prioritize skills with the largest gaps first
- If time is limited (< 8 weeks), focus on highest-impact areas only
- Make the plan realistic and achievable for a college student
- Include practice tests/mock interviews in the final weeks`;

    return prompt;
}

// ─── Response Parser ─────────────────────────────────────────────────────────

/**
 * Parses the ChatGPT response into a structured GeneratedPlan.
 * Handles potential JSON formatting issues from the LLM.
 */
export function parsePlanResponse(
    response: string,
    request: PlanRequest
): GeneratedPlan {
    try {
        // Try to extract JSON from the response (LLM might wrap it in markdown code blocks)
        let jsonStr = response;

        // Remove markdown code block wrappers if present
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());

        // Build skill gaps array
        const skillGaps = request.requiredSkills.map((skill) => ({
            skill,
            current: request.studentSkills[skill] || 0,
            required: 5,
        }));

        return {
            trackType: request.trackType,
            targetName: request.targetName,
            totalWeeks: request.timeRemainingWeeks,
            summary: parsed.summary || "Your personalized preparation plan is ready.",
            skillGaps,
            milestones: parsed.milestones || [],
            dailySchedule: parsed.dailySchedule || "2 hours morning + 1 hour evening",
            tips: parsed.tips || [],
        };
    } catch (error) {
        // Fallback: Generate a basic plan if parsing fails
        console.error("Failed to parse plan response:", error);
        return generateFallbackPlan(request);
    }
}

// ─── Fallback Plan (used when ChatGPT response can't be parsed) ──────────────

function generateFallbackPlan(request: PlanRequest): GeneratedPlan {
    const skillGaps = request.requiredSkills.map((skill) => ({
        skill,
        current: request.studentSkills[skill] || 0,
        required: 5,
    }));

    // Sort by gap size (largest gap first)
    const sortedGaps = [...skillGaps].sort(
        (a, b) => (b.required - b.current) - (a.required - a.current)
    );

    const weeks = request.timeRemainingWeeks;
    const milestones: PlanMilestone[] = [];

    // Distribute skills evenly across weeks
    for (let w = 1; w <= Math.min(weeks, 12); w++) {
        const skillIndex = (w - 1) % sortedGaps.length;
        const focusSkill = sortedGaps[skillIndex];

        milestones.push({
            week: w,
            title: `Focus: ${focusSkill.skill}`,
            tasks: [
                `Study ${focusSkill.skill} fundamentals (2 hours)`,
                `Practice ${focusSkill.skill} problems (1.5 hours)`,
                `Review and revise previous week's topics`,
                w > weeks - 3 ? "Take a mock test" : `Build a small project using ${focusSkill.skill}`,
            ],
            resources: [
                "GeeksforGeeks",
                "LeetCode",
                `YouTube: ${focusSkill.skill} tutorials`,
            ],
            targetSkills: [focusSkill.skill],
        });
    }

    return {
        trackType: request.trackType,
        targetName: request.targetName,
        totalWeeks: weeks,
        summary: `A ${weeks}-week preparation plan for ${request.targetName} focusing on your skill gaps. Prioritized by the largest gaps first.`,
        skillGaps,
        milestones,
        dailySchedule: "Morning: 2 hours focused study | Afternoon: 1 hour practice | Evening: 30 min revision",
        tips: [
            "Consistency is more important than intensity. Study daily.",
            "Track your progress weekly and adjust the plan as needed.",
            "Practice under timed conditions to simulate real scenarios.",
            "Join online communities for peer support and motivation.",
        ],
    };
}
