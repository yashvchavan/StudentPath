import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import pool from "@/lib/db";
import {
    createConversation,
    addMessage,
    getConversationMessages,
    getUserContext,
    updateConversationTitle,
    generateConversationTitle,
    getConversation,
} from "@/lib/chat";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI Learning Assistant for StudentPath, a personalized learning platform for students. Your role is to:

1. **Provide Personalized Study Guidance**: Analyze student progress, identify weak areas, and create customized study schedules with specific timelines.

2. **Career Path Recommendations**: Guide students based on their skills, interests, and goals. Suggest relevant career paths with actionable roadmaps.

3. **Course Recommendations**: Suggest courses, tutorials, and learning resources with direct links when possible.

4. **Timeline Creation**: When asked about learning roadmaps, provide detailed week-by-week or month-by-month plans with:
   - Specific topics to cover
   - Recommended free resources (YouTube channels, documentation, courses)
   - Practice projects
   - Milestones and checkpoints

5. **Resource Links**: Always include relevant links to:
   - Free courses (freeCodeCamp, Coursera, edX, YouTube)
   - Documentation (MDN, official docs)
   - Practice platforms (LeetCode, HackerRank, CodeWars)
   - Project ideas and tutorials

6. **Skills Assessment**: Help students identify skill gaps and provide targeted improvement plans.

7. **Academic Support**: Answer questions about programming concepts, data structures, algorithms, web development, and other technical topics.

**CRITICAL RESTRICTIONS**:
⚠️ **YOU MUST ONLY RESPOND TO EDUCATIONAL AND LEARNING-RELATED QUERIES**

**REFUSE to answer questions about**:
- Politics, political figures, elections, or political opinions
- Current events, news, or controversial social topics
- Personal opinions on non-educational matters
- Entertainment, sports, or celebrity gossip
- Religion or religious debates
- Dating, relationships (unless career/professional networking)
- Medical advice or diagnoses
- Legal advice
- Financial investment advice (career salary info is OK)
- Any topic unrelated to education, learning, career development, or academic growth

**If asked an off-topic question, respond with**:
"I'm an educational learning assistant focused on helping you with your academic and career goals. I can help with:
- Study planning and learning roadmaps
- Course and resource recommendations
- Career guidance and skill development
- Technical topics and programming concepts
- Academic support and project guidance

How can I assist you with your learning journey today?"

**Response Format Guidelines**:
- Be concise but comprehensive
- Use bullet points and structured formatting
- Include specific timeframes (weeks, months)
- Always provide actionable next steps
- Include 2-3 relevant resource links when applicable
- Be encouraging and supportive

**Example Response Structure for Roadmap Requests**:
"Here's your personalized [X] learning roadmap:

**Phase 1: Foundation (Weeks 1-4)**
- Topics: [list]
- Resources: [links]
- Practice: [specific exercises]

**Phase 2: Intermediate (Weeks 5-8)**
- Topics: [list]
- Resources: [links]
- Project: [specific project idea]

[Continue with more phases...]

**Recommended Resources**:
1. [Resource name] - [URL]
2. [Resource name] - [URL]

**Next Steps**: [immediate action items]"

Remember: You're a supportive mentor focused EXCLUSIVELY on helping students achieve their educational and career goals efficiently. Stay strictly within your educational domain.`;

// Helper: validate user exists
async function validateUser(userId: number, userType: "student" | "professional") {
    const table = userType === "student" ? "Students" : "professionals";
    const idField = userType === "student" ? "student_id" : "id";

    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [userId]);
    if (!rows || (rows as any).length === 0) return null;
    return (rows as any)[0];
}

// Helper: build user context string from database row
function buildUserContextString(user: any, userType: "student" | "professional"): string {
    if (userType === "student") {
        return `
**Student Context**:
- Name: ${user.first_name || "Student"} ${user.last_name || ""}
- Current Year: ${user.current_year || "Not specified"}
- Program: ${user.program || "Not specified"}
- College: ${user.college || "Not specified"}
- Current GPA: ${user.current_gpa || "Not specified"}
- Technical Skills: ${user.technical_skills || "Not specified"}
- Soft Skills: ${user.soft_skills || "Not specified"}
- Academic Interests: ${user.academic_interests || "Not specified"}
- Career Goals: ${user.primary_goal || "Not specified"}
- Secondary Goal: ${user.secondary_goal || "Not specified"}
- Timeline: ${user.timeline || "Not specified"}
- Intensity Level: ${user.intensity_level || "Not specified"}`;
    } else {
        return `
**Professional Context**:
- Name: ${user.first_name || "Professional"} ${user.last_name || ""}
- Current Role: ${user.current_role || "Not specified"}
- Industry: ${user.industry || "Not specified"}
- Experience Level: ${user.experience_level || "Not specified"}`;
    }
}

// Helper: Check if query is educational/on-topic
function isEducationalQuery(message: string): boolean {
    const message_lower = message.toLowerCase();
    
    // Off-topic keywords that should be rejected
    const offTopicKeywords = [
        'trump', 'biden', 'election', 'president', 'politician',
        'democrat', 'republican', 'political party', 'vote',
        'war', 'military conflict', 'terrorism',
        'religion', 'religious', 'god', 'allah', 'jesus',
        'dating', 'relationship advice', 'breakup',
        'celebrity', 'movie review', 'sports match',
        'stock market', 'crypto investment', 'buy stocks'
    ];
    
    // Check for off-topic keywords
    for (const keyword of offTopicKeywords) {
        if (message_lower.includes(keyword)) {
            return false;
        }
    }
    
    // If message is very generic/casual (like "hi", "hello"), allow it
    const genericGreetings = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
    if (genericGreetings.some(greeting => message_lower.trim() === greeting)) {
        return true;
    }
    
    // Educational keywords that should be allowed
    const educationalKeywords = [
        'learn', 'study', 'course', 'career', 'skill', 'tutorial',
        'programming', 'code', 'algorithm', 'project', 'roadmap',
        'development', 'engineer', 'design', 'data', 'software',
        'web', 'mobile', 'app', 'database', 'api', 'framework',
        'college', 'university', 'degree', 'exam', 'assignment',
        'job', 'interview', 'resume', 'portfolio', 'internship'
    ];
    
    // If it contains educational keywords, it's likely on-topic
    const hasEducationalKeyword = educationalKeywords.some(keyword => 
        message_lower.includes(keyword)
    );
    
    if (hasEducationalKeyword) {
        return true;
    }
    
    // For ambiguous queries, allow them and let the AI handle the filtering
    // This prevents false positives
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const { message, conversationId, userId, userType, syllabusContext, userContext } = await req.json();

        console.log("=== CHAT API REQUEST ===");
        console.log("Message:", message);
        console.log("Conversation ID:", conversationId);
        console.log("User ID:", userId);
        console.log("User Type:", userType);
        console.log("Syllabus Context:", syllabusContext);
        console.log("========================");

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }
        if (!userId || !userType) {
            return NextResponse.json({ error: "UserId and userType are required" }, { status: 400 });
        }

        // Check if query is educational/on-topic (basic filter)
        if (!isEducationalQuery(message)) {
            console.log("⚠️ Off-topic query detected:", message);
            return NextResponse.json({ 
                message: "I'm an educational learning assistant focused on helping you with your academic and career goals. I can help with study planning, course recommendations, career guidance, and technical topics. How can I assist you with your learning journey today?",
                conversationId: conversationId,
                filtered: true
            });
        }

        // Validate user
        const user = await validateUser(userId, userType);
        if (!user) {
            return NextResponse.json({ error: "Invalid user" }, { status: 401 });
        }

        let currentConversationId = conversationId;

        // If no conversation ID, create a new conversation
        if (!currentConversationId) {
            const title = generateConversationTitle(message);
            currentConversationId = await createConversation(userId, userType, title);
        } else {
            // Verify conversation exists and user has access
            const conversation = await getConversation(currentConversationId, userId, userType);
            if (!conversation) {
                return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
            }
        }

        // Save user message
        await addMessage(currentConversationId, "user", message);

        // Get conversation history
        const conversationHistory = await getConversationMessages(currentConversationId);
        const recentMessages = conversationHistory.slice(-20).map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
        }));

        // Build system prompt with user context and syllabus context
        let contextualPrompt = SYSTEM_PROMPT + buildUserContextString(user, userType);
        
        console.log("=== USER CONTEXT ===");
        console.log(buildUserContextString(user, userType));
        console.log("====================");
        
        // Add syllabus context if available
        if (syllabusContext && syllabusContext.trim()) {
            console.log("=== ADDING SYLLABUS CONTEXT ===");
            console.log("Syllabus Context Length:", syllabusContext.length);
            console.log("Syllabus Context Preview:", syllabusContext.substring(0, 200) + "...");
            console.log("================================");
            
            contextualPrompt += `\n\n**Current Academic Syllabus Context**:\n${syllabusContext}\n
**IMPORTANT**: When providing recommendations, prioritize subjects and topics from the student's current syllabus. 
Suggest study plans, resources, and practice materials specifically aligned with their ongoing coursework.
If they ask for help with specific subjects, reference their syllabus context to provide targeted guidance.`;
        } else {
            console.log("⚠️ No syllabus context provided");
        }

        // Add any user-provided context (used for professionals or ad-hoc inputs)
        if (userContext && typeof userContext === 'string' && userContext.trim()) {
            console.log('=== ADDING USER PROVIDED CONTEXT ===');
            console.log('User Context Length:', userContext.length);
            console.log('User Context Preview:', userContext.substring(0, 200) + '...');
            console.log('====================================');

            contextualPrompt += `\n\n**User Provided Context**:\n${userContext}\n\n**IMPORTANT**: Use this context when generating personalized recommendations and responses.`;
        } else {
            console.log('⚠️ No user-provided context included in request');
        }

        console.log("=== FINAL CONTEXTUAL PROMPT LENGTH ===");
        console.log("Total prompt length:", contextualPrompt.length);
        console.log("======================================");

        // Call OpenAI
        console.log("=== CALLING OPENAI ===");
        console.log("Model: gpt-4-turbo-preview");
        console.log("Recent messages count:", recentMessages.length);
        console.log("======================");
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: contextualPrompt },
                ...recentMessages
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const assistantMessage = completion.choices[0].message;
        const tokensUsed = completion.usage?.total_tokens || 0;

        console.log("=== OPENAI RESPONSE ===");
        console.log("Tokens used:", tokensUsed);
        console.log("Response length:", assistantMessage.content?.length || 0);
        console.log("Response preview:", assistantMessage.content?.substring(0, 100) + "...");
        console.log("=======================");

        // Save assistant response
        await addMessage(currentConversationId, "assistant", assistantMessage.content || "", tokensUsed);

        return NextResponse.json({
            message: assistantMessage.content,
            conversationId: currentConversationId,
            tokensUsed,
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to generate response" 
        }, { status: 500 });
    }
}