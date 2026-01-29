import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface ProfessionalProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company: string;
    designation: string;
    industry: string;
    experience: string;
    current_salary: string;
    expected_salary: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    skills: string[];
    certifications: string;
    career_goals: string;
    preferred_learning_style: string;
}

/**
 * POST /api/professionals/chat
 * Professional-specific chat endpoint that uses DB profile + query
 * 
 * Request body:
 * {
 *   "message": "How should I prepare for a senior role at Google?",
 *   "conversationId": null | number
 * }
 */
export async function POST(req: NextRequest) {
    const connection = await pool.getConnection();

    try {
        const cookieStore = await cookies();
        const professionalCookie = cookieStore.get("professionalData")?.value;

        // Verify professional authentication
        if (!professionalCookie) {
            return NextResponse.json(
                { error: "Unauthorized. Professional login required." },
                { status: 401 }
            );
        }

        let professionalData;
        try {
            professionalData = JSON.parse(professionalCookie);
        } catch {
            return NextResponse.json(
                { error: "Invalid session data" },
                { status: 401 }
            );
        }

        const professionalId = professionalData?.id;
        if (!professionalId) {
            return NextResponse.json(
                { error: "Invalid session: missing professional ID" },
                { status: 401 }
            );
        }

        // Get professional's full profile from database
        const [profileRows]: any = await connection.execute(
            `SELECT 
        id, first_name, last_name, email, phone, company, designation, 
        industry, experience, current_salary, expected_salary,
        linkedin, github, portfolio,
        skills, certifications, career_goals, preferred_learning_style
      FROM professionals 
      WHERE id = ? AND is_active = 1`,
            [professionalId]
        );

        if (!profileRows || profileRows.length === 0) {
            connection.release();
            return NextResponse.json(
                { error: "Professional profile not found" },
                { status: 404 }
            );
        }

        const profile = profileRows[0];

        // Parse skills JSON
        let skills: string[] = [];
        try {
            skills = profile.skills ? JSON.parse(profile.skills) : [];
        } catch {
            skills = [];
        }

        const body = await req.json();
        const { message, conversationId } = body;

        if (!message) {
            connection.release();
            return NextResponse.json(
                { error: "Missing required field: message" },
                { status: 400 }
            );
        }

        // Build professional context for AI
        const professionalContext = buildProfessionalContext({
            ...profile,
            skills,
        });

        // Get or create conversation
        let currentConversationId = conversationId;

        if (!currentConversationId) {
            // Create new conversation
            const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
            const [insertResult]: any = await connection.execute(
                `INSERT INTO chat_conversations (user_id, user_type, title, created_at, updated_at) 
         VALUES (?, 'professional', ?, NOW(), NOW())`,
                [professionalId, title]
            );
            currentConversationId = insertResult.insertId;
        }

        // Save user message
        await connection.execute(
            `INSERT INTO chat_messages (conversation_id, role, content, created_at) 
       VALUES (?, 'user', ?, NOW())`,
            [currentConversationId, message]
        );

        // Get conversation history (last 10 messages for context)
        const [historyRows]: any = await connection.execute(
            `SELECT role, content FROM chat_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at DESC LIMIT 10`,
            [currentConversationId]
        );

        const conversationHistory = historyRows.reverse().map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        }));

        // Generate AI response with professional context
        const systemPrompt = `You are an AI career assistant for professionals. You have access to the user's complete professional profile from our database and should provide personalized, actionable advice.

${professionalContext}

Your capabilities:
1. **Contextual Analysis**: Use the database profile above for every answer.
2. **Link Handling**: While you cannot live-browse external URLs in real-time, you can analyze the *intent* of links provided (like portfolios) based on the user's stated skills and experience from their profile. If they provide a link, acknowledge it and provide advice based on their known profile.
3. **Company Preparation**: Interview prep and culture analysis.
4. **Educational Guidance**: Recommend certifications and learning paths.
5. **Career Strategy**: Salary, transitions, and resume optimization.

Guidelines:
- **FORMATTING**: Use clean Markdown. Use '###' for section titles, '##' for main headers, and '####' for sub-points. Use bullet points or numbered lists for steps.
- **PERSONALIZATION**: Always reference their current role at ${profile.company || "their company"} and ${profile.experience || "experience level"}.
- Provide specific, actionable recommendations.
- Connect advice to their career goals: ${profile.career_goals || "not specified"}.
- Suggest relevant certifications based on: ${skills.join(", ") || "none specified"}.
- **EMOJIS**: Use professional emojis (🚀, 💡, 🎯, 📈) to make responses engaging.

Be professional and encouranging.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const assistantMessage = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

        // Save assistant message
        await connection.execute(
            `INSERT INTO chat_messages (conversation_id, role, content, created_at) 
       VALUES (?, 'assistant', ?, NOW())`,
            [currentConversationId, assistantMessage]
        );

        // Update conversation timestamp
        await connection.execute(
            `UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?`,
            [currentConversationId]
        );

        connection.release();

        // Generate sources based on the query and profile
        const sources = generateSources(message, { ...profile, skills });

        return NextResponse.json({
            success: true,
            message: assistantMessage,
            conversationId: currentConversationId,
            sources,
            context: {
                hasProfileData: true,
                professional: `${profile.first_name} ${profile.last_name}`,
                company: profile.company,
                role: profile.designation,
            },
        });
    } catch (error) {
        console.error("❌ Error in /api/professionals/chat:", error);
        connection.release();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function buildProfessionalContext(profile: ProfessionalProfile): string {
    const parts = [];

    parts.push(`## User Profile`);
    parts.push(`**Name**: ${profile.first_name} ${profile.last_name}`);
    parts.push(`**Email**: ${profile.email}`);
    if (profile.phone) parts.push(`**Phone**: ${profile.phone}`);

    if (profile.designation) parts.push(`**Current Role**: ${profile.designation}`);
    if (profile.company) parts.push(`**Company**: ${profile.company}`);
    if (profile.industry) parts.push(`**Industry**: ${profile.industry}`);
    if (profile.experience) parts.push(`**Experience**: ${profile.experience}`);

    if (profile.current_salary) parts.push(`**Current Salary**: ${profile.current_salary}`);
    if (profile.expected_salary) parts.push(`**Expected Salary**: ${profile.expected_salary}`);

    if (profile.linkedin) parts.push(`**LinkedIn**: ${profile.linkedin}`);
    if (profile.github) parts.push(`**GitHub**: ${profile.github}`);
    if (profile.portfolio) parts.push(`**Portfolio**: ${profile.portfolio}`);

    if (profile.skills && profile.skills.length > 0) {
        parts.push(`**Skills**: ${profile.skills.join(", ")}`);
    }

    if (profile.certifications) parts.push(`**Certifications**: ${profile.certifications}`);
    if (profile.career_goals) parts.push(`**Career Goals**: ${profile.career_goals}`);
    if (profile.preferred_learning_style) parts.push(`**Learning Style**: ${profile.preferred_learning_style}`);

    return parts.join("\n");
}

function generateSources(query: string, profile: ProfessionalProfile): any[] {
    const lowQuery = query.toLowerCase();
    const sources = [];

    // Always include profile source
    sources.push({
        title: "Your Professional Profile",
        type: "profile",
        snippet: `${profile.designation || "Professional"} at ${profile.company || "Company"} • ${profile.experience || "Experience not specified"}`,
        score: 0.98,
    });

    if (lowQuery.includes("interview") || lowQuery.includes("prepare") || lowQuery.includes("company")) {
        sources.push({
            title: "Interview Preparation Guide",
            type: "internal",
            snippet: `Tailored for ${profile.industry || "your industry"} roles`,
            score: 0.92,
        });
    }

    if (lowQuery.includes("salary") || lowQuery.includes("negotiate") || lowQuery.includes("compensation")) {
        sources.push({
            title: "Salary Insights",
            type: "market",
            snippet: `Based on ${profile.designation || "your role"} in ${profile.industry || "tech"}`,
            score: 0.89,
        });
    }

    if (lowQuery.includes("learn") || lowQuery.includes("course") || lowQuery.includes("certif")) {
        sources.push({
            title: "Learning Recommendations",
            type: "educational",
            snippet: `Aligned with your skills: ${(profile.skills || []).slice(0, 3).join(", ") || "not specified"}`,
            score: 0.87,
        });
    }

    if (lowQuery.includes("career") || lowQuery.includes("growth") || lowQuery.includes("goal")) {
        sources.push({
            title: "Career Trajectory Analysis",
            type: "career",
            snippet: profile.career_goals || "Based on your profile and industry trends",
            score: 0.85,
        });
    }

    return sources.slice(0, 4);
}
