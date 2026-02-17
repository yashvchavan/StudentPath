/**
 * AI Extraction Service
 * Extracts structured data from student placement reviews using OpenAI
 */

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedData {
    skills: string[];
    rounds: Array<{ name: string; type: string }>;
    totalRounds: number;
    difficultyLevel: "Easy" | "Medium" | "Hard";
    confidenceScore: number;
}

export interface ReviewData {
    rating: number;
    comment: string;
    interviewExperience?: string;
    questionsAsked?: string;
    preparationTips?: string;
    overallExperience?: string;
}

/**
 * Extract structured data from a single review
 */
export async function extractFromReview(review: ReviewData): Promise<ExtractedData> {
    const prompt = `You are an AI assistant that extracts structured information from student placement interview reviews.

Analyze the following review and extract:
1. Technical and soft skills mentioned (e.g., DSA, DBMS, Communication, Problem Solving)
2. Interview round names and types (e.g., {"name": "Aptitude Test", "type": "Written"})
3. Total number of rounds
4. Difficulty level (Easy/Medium/Hard) based on the student's experience

Review Data:
Rating: ${review.rating}/5
Comment: ${review.comment || ""}
Interview Experience: ${review.interviewExperience || ""}
Questions Asked: ${review.questionsAsked || ""}
Preparation Tips: ${review.preparationTips || ""}
Overall Experience: ${review.overallExperience || ""}

Return ONLY a valid JSON object with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "rounds": [{"name": "Round Name", "type": "Technical/HR/Aptitude/Group Discussion"}],
  "totalRounds": 3,
  "difficultyLevel": "Easy|Medium|Hard",
  "confidenceScore": 0.85
}

Rules:
- Extract only skills explicitly mentioned
- Infer round types from context (Technical, HR, Aptitude, Group Discussion, Case Study)
- Difficulty: Easy (rating 4-5, positive tone), Medium (rating 3, mixed), Hard (rating 1-2, negative)
- Confidence score: 0.0-1.0 based on how clear the information is
- Return valid JSON only, no markdown or explanations`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a data extraction assistant. Return only valid JSON, no markdown formatting.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content?.trim() || "{}";

        // Remove markdown code blocks if present
        const jsonContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const extracted = JSON.parse(jsonContent);

        return {
            skills: extracted.skills || [],
            rounds: extracted.rounds || [],
            totalRounds: extracted.totalRounds || 0,
            difficultyLevel: extracted.difficultyLevel || "Medium",
            confidenceScore: extracted.confidenceScore || 0.5,
        };
    } catch (error) {
        console.error("Error extracting from review:", error);
        throw new Error("Failed to extract data from review");
    }
}

/**
 * Aggregate extracted data from multiple reviews
 */
export async function extractFromMultipleReviews(
    reviews: ReviewData[]
): Promise<ExtractedData> {
    if (reviews.length === 0) {
        return {
            skills: [],
            rounds: [],
            totalRounds: 0,
            difficultyLevel: "Medium",
            confidenceScore: 0,
        };
    }

    // Extract from each review
    const extractions = await Promise.all(
        reviews.map((review) => extractFromReview(review))
    );

    // Aggregate skills (count frequency)
    const skillFrequency = new Map<string, number>();
    extractions.forEach((ext) => {
        ext.skills.forEach((skill) => {
            const normalized = skill.trim().toLowerCase();
            skillFrequency.set(normalized, (skillFrequency.get(normalized) || 0) + 1);
        });
    });

    // Get top skills (mentioned in at least 20% of reviews or at least once)
    const threshold = Math.max(1, Math.ceil(reviews.length * 0.2));
    const topSkills = Array.from(skillFrequency.entries())
        .filter(([_, count]) => count >= threshold)
        .sort((a, b) => b[1] - a[1])
        .map(([skill]) => skill)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1)); // Capitalize

    // Aggregate rounds (most common structure)
    const roundsFrequency = new Map<string, { type: string; count: number }>();
    extractions.forEach((ext) => {
        ext.rounds.forEach((round) => {
            const key = round.name.toLowerCase();
            const existing = roundsFrequency.get(key);
            if (existing) {
                existing.count++;
            } else {
                roundsFrequency.set(key, { type: round.type, count: 1 });
            }
        });
    });

    const aggregatedRounds = Array.from(roundsFrequency.entries())
        .filter(([_, data]) => data.count >= threshold)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            type: data.type,
        }));

    // Calculate average total rounds
    const avgTotalRounds = Math.round(
        extractions.reduce((sum, ext) => sum + ext.totalRounds, 0) / extractions.length
    );

    // Determine difficulty (weighted by confidence)
    const difficultyScores = { Easy: 0, Medium: 0, Hard: 0 };
    extractions.forEach((ext) => {
        difficultyScores[ext.difficultyLevel] += ext.confidenceScore;
    });
    const difficulty = (Object.keys(difficultyScores) as Array<"Easy" | "Medium" | "Hard">).reduce(
        (a, b) => (difficultyScores[a] > difficultyScores[b] ? a : b)
    );

    // Average confidence score
    const avgConfidence =
        extractions.reduce((sum, ext) => sum + ext.confidenceScore, 0) / extractions.length;

    return {
        skills: topSkills,
        rounds: aggregatedRounds,
        totalRounds: avgTotalRounds,
        difficultyLevel: difficulty,
        confidenceScore: parseFloat(avgConfidence.toFixed(2)),
    };
}
