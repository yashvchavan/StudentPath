/**
 * AI Feedback Generator
 *
 * Uses OpenAI API (gpt-4o-mini) to generate qualitative resume feedback:
 * - Rejection reasons
 * - Skill gap analysis
 * - Improvement steps
 * - Bullet point improvement suggestions
 *
 * AI is used ONLY for explanations and reasoning, not for scoring.
 * Returns strict JSON — no free-form text.
 */

import OpenAI from "openai";
import type { ATSScoreResult, CompanyRequirements } from "./ats-scorer";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface StudentContext {
    name: string;
    year: number | null;
    program: string | null;
    gpa: number | null;
    technicalSkills: string[];
    college: string | null;
}

export interface AIFeedbackResult {
    rejectionReasons: {
        reason: string;
        severity: "critical" | "major" | "minor";
        fix: string;
    }[];
    skillGapAnalysis: {
        skill: string;
        importance: "must-have" | "good-to-have" | "bonus";
        currentLevel: "missing" | "basic" | "intermediate";
        recommendation: string;
    }[];
    improvementSteps: {
        priority: number;
        area: string;
        action: string;
        expectedImpact: string;
        timeEstimate: string;
    }[];
    bulletSuggestions: {
        original: string;
        improved: string;
        reason: string;
    }[];
    overallVerdict: string;
}

/**
 * Build the system prompt for resume analysis.
 */
function buildSystemPrompt(): string {
    return `You are an expert ATS (Applicant Tracking System) resume analyst working for a career guidance platform. Your task is to analyze a student's resume against a specific company and role, then provide actionable, specific feedback.

RULES:
1. You MUST return ONLY valid JSON — no markdown, no code fences, no explanation text outside JSON.
2. Be specific and actionable — never give vague advice like "improve your resume".
3. Reference the actual company's hiring patterns and culture.
4. Consider the student's current year and experience level.
5. Be honest about rejection risks but always constructive.
6. Prioritize feedback by impact — most impactful improvements first.
7. For bullet suggestions, pick weak bullets from the resume text and show improved versions.

RESPONSE FORMAT (strict JSON):
{
  "rejectionReasons": [
    {
      "reason": "specific reason why ATS/recruiter would reject",
      "severity": "critical|major|minor",
      "fix": "specific fix for this issue"
    }
  ],
  "skillGapAnalysis": [
    {
      "skill": "skill name",
      "importance": "must-have|good-to-have|bonus",
      "currentLevel": "missing|basic|intermediate",
      "recommendation": "specific recommendation to gain/improve this skill"
    }
  ],
  "improvementSteps": [
    {
      "priority": 1,
      "area": "area of improvement",
      "action": "specific action to take",
      "expectedImpact": "expected score improvement description",
      "timeEstimate": "e.g. 1 week, 1 month"
    }
  ],
  "bulletSuggestions": [
    {
      "original": "weak bullet from resume",
      "improved": "improved version with metrics and action verbs",
      "reason": "why this is better"
    }
  ],
  "overallVerdict": "1-2 sentence overall assessment with encouragement"
}`;
}

/**
 * Build the user prompt with all context.
 */
function buildUserPrompt(
    resumeText: string,
    atsResult: ATSScoreResult,
    requirements: CompanyRequirements,
    student: StudentContext
): string {
    return `ANALYZE THIS RESUME for ${requirements.company_name} — ${requirements.role} position.

═══ STUDENT PROFILE ═══
Name: ${student.name}
College: ${student.college || "Not specified"}
Program: ${student.program || "Not specified"}
Year: ${student.year ? `Year ${student.year}` : "Not specified"}
CGPA: ${student.gpa || "Not specified"}
Known Skills: ${student.technicalSkills.length > 0 ? student.technicalSkills.join(", ") : "Not specified"}

═══ TARGET COMPANY & ROLE ═══
Company: ${requirements.company_name}
Role: ${requirements.role}
Required Skills: ${requirements.required_skills.join(", ")}
Important Keywords: ${requirements.keywords.join(", ")}
Project Expectations: ${requirements.project_expectations || "Standard project work expected"}
Min Experience: ${requirements.min_experience_months} months

═══ ATS SCORE BREAKDOWN (Rule-based, already calculated) ═══
Total Score: ${atsResult.totalScore}/100
${atsResult.sectionScores.map(s => `- ${s.name}: ${s.score}/${s.maxScore} — ${s.details}`).join("\n")}

Skills Matched: ${atsResult.matchedSkills.join(", ") || "None"}
Skills Missing: ${atsResult.missingSkills.join(", ") || "None"}
Keywords Matched: ${atsResult.matchedKeywords.join(", ") || "None"}
Keywords Missing: ${atsResult.missingKeywords.join(", ") || "None"}

═══ RESUME TEXT ═══
${resumeText.substring(0, 4000)}

═══ INSTRUCTIONS ═══
Based on the above:
1. Provide 3-5 specific rejection reasons ranked by severity.
2. Analyze each missing skill — how important is it for ${requirements.company_name}?
3. Give 5-7 prioritized improvement steps with time estimates.
4. Pick 2-3 weak bullet points from the resume and rewrite them with metrics and strong verbs.
5. Provide an encouraging overall verdict.

Return ONLY the JSON object described in the system prompt. No other text.`;
}

/**
 * Generate AI-powered resume feedback.
 * Combines rule-based scores with OpenAI reasoning for detailed feedback.
 */
export async function generateAIFeedback(
    resumeText: string,
    atsResult: ATSScoreResult,
    requirements: CompanyRequirements,
    student: StudentContext
): Promise<AIFeedbackResult> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: buildSystemPrompt() },
                { role: "user", content: buildUserPrompt(resumeText, atsResult, requirements, student) },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error("Empty response from OpenAI");
        }

        const parsed = JSON.parse(responseText) as AIFeedbackResult;

        // Validate structure
        if (!parsed.rejectionReasons || !parsed.skillGapAnalysis || !parsed.improvementSteps) {
            throw new Error("Invalid response structure from OpenAI");
        }

        return parsed;
    } catch (error) {
        console.error("[AIFeedback] OpenAI call failed:", error);

        // Fallback: generate basic feedback from rule-based scores
        return generateFallbackFeedback(atsResult, requirements);
    }
}

/**
 * Fallback feedback when OpenAI is unavailable.
 * Generates basic feedback from rule-based scores alone.
 */
function generateFallbackFeedback(
    atsResult: ATSScoreResult,
    requirements: CompanyRequirements
): AIFeedbackResult {
    const rejectionReasons = atsResult.missingSkills.slice(0, 3).map((skill) => ({
        reason: `Missing required skill: ${skill}`,
        severity: "major" as const,
        fix: `Add ${skill} to your resume. Consider building a project using ${skill}.`,
    }));

    const skillGapAnalysis = atsResult.missingSkills.map((skill) => ({
        skill,
        importance: "must-have" as const,
        currentLevel: "missing" as const,
        recommendation: `Learn ${skill} through online courses or projects. Add it to your skills section once proficient.`,
    }));

    const improvementSteps = [
        {
            priority: 1,
            area: "Skills",
            action: `Add missing skills: ${atsResult.missingSkills.join(", ")}`,
            expectedImpact: "Could improve score by 10-15 points",
            timeEstimate: "1-2 weeks",
        },
        {
            priority: 2,
            area: "Keywords",
            action: `Include these keywords naturally: ${atsResult.missingKeywords.join(", ")}`,
            expectedImpact: "Could improve score by 5-10 points",
            timeEstimate: "1 day",
        },
        {
            priority: 3,
            area: "Projects",
            action: "Add quantified outcomes to your project descriptions (e.g., '40% faster', '1000+ users')",
            expectedImpact: "Could improve score by 5-10 points",
            timeEstimate: "1 day",
        },
    ];

    return {
        rejectionReasons,
        skillGapAnalysis,
        improvementSteps,
        bulletSuggestions: [],
        overallVerdict: `Your resume scores ${atsResult.totalScore}/100 for ${requirements.company_name}. Focus on adding missing skills and quantifying your achievements to improve significantly.`,
    };
}
