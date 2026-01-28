import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import pool from "@/lib/db";
import {
    createConversation,
    addMessage,
    getConversationMessages,
    generateConversationTitle,
    getConversation,
} from "@/lib/chat";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const RAG_API_URL = process.env.RAG_API_URL || "https://rag-python-service-2312.onrender.com";

const SYSTEM_PROMPT = `You are an AI Learning Assistant for StudentPath, a personalized learning platform for students. Your role is to:

1. **Provide Personalized Study Guidance**: Analyze student progress based on their syllabus, identify weak areas, and create customized study schedules with specific timelines.

2. **Syllabus-Aware Recommendations**: When students ask about learning paths or subjects, ALWAYS reference their actual syllabus data to provide accurate information about:
   - Current semester subjects
   - Upcoming subjects in future semesters
   - Prerequisites and dependencies between subjects
   - Credits and workload distribution

3. **Career Path Recommendations**: Guide students based on their skills, interests, syllabus subjects, and goals. Connect their current academic subjects to potential career paths.

4. **Timeline Creation**: When asked about learning roadmaps, provide detailed plans that:
   - Align with their academic semester structure
   - Suggest when to learn what based on syllabus progression
   - Identify gaps between syllabus and career interests
   - Recommend supplementary learning for skills not in syllabus

5. **Personalized Advice**: Use the student's academic profile (GPA, interests, skills, goals) along with their syllabus to provide tailored recommendations. For example:
   - If they're interested in Web Development and have HTML/CSS in semester 3, tell them to prepare ahead
   - If they're in semester 2 but interested in advanced topics, suggest foundational subjects to focus on first
   - Connect their career goals with specific syllabus subjects

6. **Resource Links**: Include relevant links to free learning resources when appropriate.

**RESPONSE GUIDELINES**:
- Be conversational, supportive, and encouraging
- ALWAYS reference the student's actual syllabus and profile data when relevant
- Connect theoretical subjects to practical career applications
- Provide actionable next steps
- Use structured formatting with bullet points and sections for longer responses

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

**If asked an off-topic question, respond with**:
"I'm your personalized learning assistant focused on your academic journey! I can help with your syllabus subjects, study planning, career guidance, and skill development. What would you like to explore?"

Remember: You have access to the student's actual syllabus and academic profile. Use this data to provide specific, actionable, and personalized guidance.`;

// Helper: validate user exists
async function validateUser(userId: number, userType: "student" | "professional") {
    const table = userType === "student" ? "Students" : "professionals";
    const idField = userType === "student" ? "student_id" : "id";

    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [userId]);
    if (!rows || (rows as any).length === 0) return null;
    return (rows as any)[0];
}

// Helper: Get comprehensive student data
async function getStudentContext(studentId: number): Promise<any> {
    // Get basic student info and college
    const [studentRows]: any = await pool.query(
        `SELECT 
            s.first_name, s.last_name, s.email, s.college_token,
            c.college_name, c.college_type, c.city, c.state
         FROM Students s
         LEFT JOIN colleges c ON s.college_token = c.college_token
         WHERE s.student_id = ?`,
        [studentId]
    );

    if (!studentRows || studentRows.length === 0) return null;
    const student = studentRows[0];

    // Get academic profile
    const [academicRows]: any = await pool.query(
        `SELECT program, currentYear, currentSemester, enrollmentYear, currentGPA
         FROM academic_profiles
         WHERE student_id = ?`,
        [studentId]
    );
    const academicProfile = academicRows?.[0] || {};

    // Get academic interests
    const [interestRows]: any = await pool.query(
        `SELECT interest FROM academic_interests WHERE student_id = ?`,
        [studentId]
    );
    const academicInterests = (interestRows || []).map((row: any) => row.interest);

    // Get skills
    const [skillRows]: any = await pool.query(
        `SELECT skillType, skillName, proficiencyLevel 
         FROM skills 
         WHERE student_id = ?`,
        [studentId]
    );

    const technicalSkills: Record<string, number> = {};
    const softSkills: Record<string, number> = {};

    if (skillRows && Array.isArray(skillRows)) {
        skillRows.forEach((skill: any) => {
            if (skill.skillType === 'technical') {
                technicalSkills[skill.skillName] = skill.proficiencyLevel;
            } else if (skill.skillType === 'soft') {
                softSkills[skill.skillName] = skill.proficiencyLevel;
            }
        });
    }

    // Get career goals
    const [careerRows]: any = await pool.query(
        `SELECT primaryGoal, secondaryGoal, timeline, intensityLevel
         FROM career_goals
         WHERE student_id = ?`,
        [studentId]
    );
    const careerGoals = careerRows?.[0] || {};

    return {
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        email: student.email,
        college: {
            name: student.college_name,
            type: student.college_type,
            city: student.city,
            state: student.state,
            token: student.college_token
        },
        academic: {
            program: academicProfile.program || null,
            currentYear: academicProfile.currentYear || null,
            currentSemester: academicProfile.currentSemester || null,
            enrollmentYear: academicProfile.enrollmentYear || null,
            currentGPA: academicProfile.currentGPA || null,
            interests: academicInterests
        },
        skills: {
            technical: technicalSkills,
            soft: softSkills
        },
        careerGoals: {
            primary: careerGoals.primaryGoal || null,
            secondary: careerGoals.secondaryGoal || null,
            timeline: careerGoals.timeline || null,
            intensity: careerGoals.intensityLevel || null
        }
    };
}

// Helper: Query RAG API for syllabus context
async function getSyllabusContext(question: string, studentContext: any): Promise<any> {
    try {
        // Extract department from program name (e.g., "Computer Engineering" -> "Computer")
        const program = studentContext.academic?.program || '';
        const dept = extractDepartment(program);

        // Calculate the syllabus year (calendar year format) that matches ingestion
        // The ingestion uses calendar year (e.g., "2024") 
        // We need to determine which syllabus year applies to this student
        const enrollmentYear = studentContext.academic?.enrollmentYear || new Date().getFullYear();
        const currentAcademicYear = studentContext.academic?.currentYear || 1;

        // Syllabus year = enrollment year (the year the syllabus was for)
        // If student enrolled in 2024, they use the 2024 syllabus
        const syllabusYear = String(enrollmentYear);

        // Build student data header for RAG API
        // The RAG API expects these specific fields for filtering:
        // - dept: Department name (must match what was used during ingestion)
        // - year: Syllabus year (calendar year format, e.g., "2024")
        // NOTE: semester is NOT included - vectors don't have semester metadata
        const studentDataHeader = {
            // Required auth fields
            student_id: studentContext.student_id,
            token: studentContext.college?.token,
            isAuthenticated: true,

            // Required for RAG filtering - these must match ingestion parameters
            dept: dept,
            year: syllabusYear, // Use calendar year format to match ingestion
            // semester: excluded - not in vector metadata, causes filter mismatch

            // Additional context for the RAG to understand student's position
            year_level: String(currentAcademicYear), // Academic year (1, 2, 3, 4)
            enrollment_year: enrollmentYear,

            // Additional context
            name: studentContext.name,
            email: studentContext.email,
            program: program,
            college: studentContext.college,
            interests: studentContext.academic?.interests || [],
            skills: studentContext.skills,
            career_goals: studentContext.careerGoals
        };

        console.log("📚 Querying RAG API for syllabus context...");
        console.log("📚 RAG Request params:", {
            dept: studentDataHeader.dept,
            year: studentDataHeader.year,
            year_level: studentDataHeader.year_level,
            enrollment_year: studentDataHeader.enrollment_year,
            program: program,
            token: studentDataHeader.token ? '✓' : '✗'
        });

        const response = await fetch(`${RAG_API_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-student-data": JSON.stringify(studentDataHeader),
            },
            // Request body includes filtering parameters as per API spec
            // NOTE: Do NOT send semester - vectors are not indexed by semester
            // This causes filter mismatch and returns 0 sources
            body: JSON.stringify({
                question,
                dept: dept,
                year: syllabusYear,
                year_level: String(currentAcademicYear),
                enrollment_year: enrollmentYear,
                // semester: excluded - not in vector metadata
                program: program,
                token: studentContext.college?.token || ''
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log("⚠️ RAG API returned non-OK status:", response.status, errorText);
            return null;
        }

        const data = await response.json();
        console.log("📚 RAG API response:", {
            hasAnswer: !!data.answer,
            confidence: data.confidence,
            sourcesCount: data.sources?.length || 0
        });

        return data;
    } catch (error) {
        console.error("❌ Error querying RAG API:", error);
        return null;
    }
}

// Helper: Extract department name from program (e.g., "Computer Engineering" -> "Computer")
function extractDepartment(program: string): string {
    if (!program) return '';

    // Common mappings
    const mappings: Record<string, string> = {
        'computer engineering': 'Computer',
        'computer science': 'Computer',
        'mechanical engineering': 'Mechanical',
        'electrical engineering': 'Electrical',
        'electronics': 'ENTC',
        'electronics and telecommunication': 'ENTC',
        'entc': 'ENTC',
        'information technology': 'IT',
        'civil engineering': 'Civil',
    };

    const normalized = program.toLowerCase().trim();

    // Check for exact or partial matches
    for (const [key, value] of Object.entries(mappings)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    // Fallback: take first word
    return program.split(' ')[0];
}

// Build context string for LLM
function buildContextString(studentContext: any, syllabusContext: any): string {
    let contextStr = `\n\n**STUDENT PROFILE DATA**:\n`;

    contextStr += `- Name: ${studentContext.name}\n`;
    contextStr += `- College: ${studentContext.college?.name || 'Not specified'}\n`;
    contextStr += `- Program: ${studentContext.academic?.program || 'Not specified'}\n`;
    contextStr += `- Current Year: ${studentContext.academic?.currentYear || 'Not specified'}\n`;
    contextStr += `- Current Semester: ${studentContext.academic?.currentSemester || 'Not specified'}\n`;
    contextStr += `- GPA: ${studentContext.academic?.currentGPA || 'Not specified'}\n`;

    if (studentContext.academic?.interests?.length > 0) {
        contextStr += `- Academic Interests: ${studentContext.academic.interests.join(', ')}\n`;
    }

    if (Object.keys(studentContext.skills?.technical || {}).length > 0) {
        const skills = Object.entries(studentContext.skills.technical)
            .map(([skill, level]) => `${skill} (${level}/5)`)
            .join(', ');
        contextStr += `- Technical Skills: ${skills}\n`;
    }

    if (studentContext.careerGoals?.primary) {
        contextStr += `- Primary Career Goal: ${studentContext.careerGoals.primary}\n`;
    }
    if (studentContext.careerGoals?.secondary) {
        contextStr += `- Secondary Goal: ${studentContext.careerGoals.secondary}\n`;
    }
    if (studentContext.careerGoals?.timeline) {
        contextStr += `- Timeline: ${studentContext.careerGoals.timeline}\n`;
    }

    // Add syllabus context if available
    if (syllabusContext) {
        contextStr += `\n**SYLLABUS DATA FROM VECTOR DATABASE** (Confidence: ${syllabusContext.confidence || 'unknown'}):\n`;

        if (syllabusContext.answer) {
            contextStr += `RAG Answer: ${syllabusContext.answer}\n`;
        }

        if (syllabusContext.sources && syllabusContext.sources.length > 0) {
            contextStr += `\nRelevant Syllabus Chunks:\n`;
            syllabusContext.sources.forEach((source: any, idx: number) => {
                const content = source.content || source.text || JSON.stringify(source);
                contextStr += `${idx + 1}. ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n`;
            });
        }
    } else {
        contextStr += `\n**NOTE**: No syllabus data available in vector database for this student's program. Provide general guidance based on profile.\n`;
    }

    contextStr += `\n**IMPORTANT**: Use the above student profile and syllabus data to provide personalized, specific recommendations. Reference actual subjects, semesters, and career connections where possible.\n`;

    return contextStr;
}

// Check if query is educational/on-topic
function isEducationalQuery(message: string): boolean {
    const message_lower = message.toLowerCase();

    const offTopicKeywords = [
        'trump', 'biden', 'election', 'president', 'politician',
        'democrat', 'republican', 'political party', 'vote',
        'war', 'military conflict', 'terrorism',
        'religion', 'religious', 'god', 'allah', 'jesus',
        'celebrity', 'movie review', 'sports match',
        'stock market', 'crypto investment', 'buy stocks'
    ];

    for (const keyword of offTopicKeywords) {
        if (message_lower.includes(keyword)) {
            return false;
        }
    }

    return true;
}

export async function POST(req: NextRequest) {
    try {
        const { message, conversationId, userId, userType } = await req.json();

        console.log("=== UNIFIED CHAT API REQUEST ===");
        console.log("Message:", message);
        console.log("User ID:", userId);
        console.log("User Type:", userType);
        console.log("================================");

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
                message: "I'm your personalized learning assistant focused on your academic journey! I can help with your syllabus subjects, study planning, career guidance, and skill development. What would you like to explore?",
                conversationId: conversationId,
                filtered: true
            });
        }

        // Validate user
        const user = await validateUser(userId, userType);
        if (!user) {
            return NextResponse.json({ error: "Invalid user" }, { status: 401 });
        }

        // Get comprehensive student context
        const studentContext = await getStudentContext(userId);
        if (!studentContext) {
            return NextResponse.json({ error: "Could not load student profile" }, { status: 500 });
        }
        studentContext.student_id = userId;

        console.log("📊 Student Context Loaded:", {
            name: studentContext.name,
            program: studentContext.academic?.program,
            year: studentContext.academic?.currentYear,
            semester: studentContext.academic?.currentSemester,
            interests: studentContext.academic?.interests?.length,
            skills: Object.keys(studentContext.skills?.technical || {}).length
        });

        // Query RAG API for syllabus context (parallel to conversation handling)
        const syllabusContextPromise = getSyllabusContext(message, studentContext);

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

        // Wait for syllabus context
        const syllabusContext = await syllabusContextPromise;

        // Build comprehensive system prompt with all context
        const contextString = buildContextString(studentContext, syllabusContext);
        const contextualPrompt = SYSTEM_PROMPT + contextString;

        console.log("=== SENDING TO GPT ===");
        console.log("Context length:", contextString.length);
        console.log("Has syllabus context:", !!syllabusContext);
        console.log("Recent messages:", recentMessages.length);
        console.log("======================");

        // Call OpenAI with full context
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

        console.log("=== GPT RESPONSE ===");
        console.log("Tokens used:", tokensUsed);
        console.log("Response length:", assistantMessage.content?.length || 0);
        console.log("====================");

        // Save assistant response
        await addMessage(currentConversationId, "assistant", assistantMessage.content || "", tokensUsed);

        return NextResponse.json({
            message: assistantMessage.content,
            conversationId: currentConversationId,
            tokensUsed,
            context: {
                hasSyllabusData: !!syllabusContext,
                syllabusConfidence: syllabusContext?.confidence || null,
                program: studentContext.academic?.program,
                semester: studentContext.academic?.currentSemester
            }
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate response"
        }, { status: 500 });
    }
}