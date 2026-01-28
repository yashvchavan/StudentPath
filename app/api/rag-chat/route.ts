import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

const RAG_API_URL = process.env.RAG_API_URL || "https://rag-python-service-2312.onrender.com";

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

/**
 * POST /api/rag-chat
 * Student endpoint: Ask questions about syllabus using Pinecone + GPT
 * 
 * Uses x-student-data header with student info and college context
 * Automatically filters by department, year, and semester from student's profile
 * 
 * Request body:
 * {
 *   "question": "What are the subjects in semester 5?"
 * }
 * 
 * Response:
 * {
 *   "answer": "The subjects in semester 5 are...",
 *   "sources": [...],
 *   "confidence": "high" | "medium" | "low"
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const studentCookie = cookieStore.get("studentData")?.value;

        // Verify student authentication
        if (!studentCookie) {
            return NextResponse.json(
                { error: "Unauthorized. Student login required." },
                { status: 401 }
            );
        }

        let studentData;
        try {
            studentData = JSON.parse(studentCookie);
        } catch (err) {
            return NextResponse.json(
                { error: "Invalid session data" },
                { status: 401 }
            );
        }

        const studentId = studentData?.student_id;
        if (!studentId) {
            return NextResponse.json(
                { error: "Invalid session: missing student_id" },
                { status: 401 }
            );
        }

        // Get comprehensive student data from database
        const [studentRows]: any = await pool.query(
            `SELECT 
                s.first_name, s.last_name, s.email, s.college_token,
                c.college_name, c.college_type, c.city, c.state
             FROM Students s
             LEFT JOIN colleges c ON s.college_token = c.college_token
             WHERE s.student_id = ?`,
            [studentId]
        );

        if (!studentRows || studentRows.length === 0) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

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

        // Build comprehensive student data header
        // NOTE: The token and isAuthenticated fields are required by the RAG API

        // Extract department from program name
        const program = academicProfile.program || '';
        const dept = extractDepartment(program);

        // Calculate syllabus year (use enrollment year to match ingested syllabus)
        const enrollmentYear = academicProfile.enrollmentYear || new Date().getFullYear();
        const currentAcademicYear = academicProfile.currentYear || 1;
        const syllabusYear = String(enrollmentYear);

        const studentDataHeader = {
            student_id: studentId,
            token: student.college_token, // Required by RAG API
            isAuthenticated: true, // Required by RAG API

            // Required for RAG filtering
            dept: dept,
            year: syllabusYear,
            year_level: String(currentAcademicYear),
            enrollment_year: enrollmentYear,
            // semester: excluded - not in vector metadata, causes filter mismatch
            program: program,

            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            email: student.email,
            college: {
                token: student.college_token,
                name: student.college_name,
                type: student.college_type,
                city: student.city,
                state: student.state
            },
            academic: {
                program: program,
                current_year: currentAcademicYear,
                current_semester: academicProfile.currentSemester || null,
                enrollment_year: enrollmentYear,
                current_gpa: academicProfile.currentGPA || null,
                interests: academicInterests
            },
            skills: {
                technical: technicalSkills,
                soft: softSkills
            },
            career_goals: {
                primary: careerGoals.primaryGoal || null,
                secondary: careerGoals.secondaryGoal || null,
                timeline: careerGoals.timeline || null,
                intensity: careerGoals.intensityLevel || null
            }
        };

        const body = await req.json();
        const { question, chatHistory } = body;

        // Validate required fields
        if (!question) {
            return NextResponse.json(
                { error: "Missing required field: question" },
                { status: 400 }
            );
        }

        console.log("📤 Sending chat request to RAG API:", {
            url: `${RAG_API_URL}/chat`,
            question,
            dept: dept,
            year: syllabusYear,
            year_level: String(currentAcademicYear),
            program: program,
            hasChatHistory: !!chatHistory
        });

        // Forward request to FastAPI backend with student data in header AND body
        // NOTE: Do NOT send semester - vectors are not indexed by semester
        const response = await fetch(`${RAG_API_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-student-data": JSON.stringify(studentDataHeader),
            },
            // Request body includes filtering parameters as per API spec
            // semester excluded - not in vector metadata
            body: JSON.stringify({
                question,
                dept: dept,
                year: syllabusYear,
                year_level: String(currentAcademicYear),
                enrollment_year: enrollmentYear,
                // semester: excluded - not in vector metadata
                program: program,
                token: student.college_token || ''
            }),
        });

        const data = await response.json();

        console.log("📥 RAG API Response:", {
            status: response.status,
            ok: response.ok,
            hasAnswer: !!data.answer,
            confidence: data.confidence,
            sourcesCount: data.sources?.length
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || data.message || "Failed to get answer" },
                { status: response.status }
            );
        }

        return NextResponse.json({
            answer: data.answer,
            sources: data.sources || [],
            confidence: data.confidence || "low",
            studentContext: {
                program: program,
                year: currentAcademicYear,
                semester: academicProfile.currentSemester
            }
        });
    } catch (error) {
        console.error("❌ Error in /api/rag-chat:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/rag-chat
 * Check if RAG API is healthy
 */
export async function GET() {
    try {
        const response = await fetch(`${RAG_API_URL}/`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    status: "unhealthy",
                    error: "RAG API is not responding",
                    details: data
                },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: "healthy",
            rag_api: data,
            rag_api_url: RAG_API_URL,
        });
    } catch (error) {
        console.error("❌ Error checking RAG API health:", error);
        return NextResponse.json(
            {
                status: "unhealthy",
                error: "Failed to connect to RAG API",
                rag_api_url: RAG_API_URL,
            },
            { status: 503 }
        );
    }
}
