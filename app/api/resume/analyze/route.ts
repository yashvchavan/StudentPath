/**
 * POST /api/resume/analyze
 *
 * Run ATS analysis on a resume against a specific company and role.
 * Combines rule-based scoring with AI-powered feedback.
 * 
 * For companies not in the DB, uses OpenAI to generate requirements dynamically.
 * For on-campus companies, pulls data from the placements table.
 *
 * Auth: Student only.
 *
 * Request body: { resumeId: number, companyId: string, companyName?: string, targetRole: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";
import { parseResume } from "@/lib/resume/parser";
import { calculateATSScore, type CompanyRequirements } from "@/lib/resume/ats-scorer";
import { generateAIFeedback, type StudentContext } from "@/lib/resume/ai-feedback";
import { seedCompanyRequirements, getCompanyRequirements } from "@/lib/resume/requirements-seed";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Use OpenAI to generate company-specific requirements for any company.
 * This handles popular companies like Google, Microsoft, etc. that aren't in our DB.
 */
async function generateCompanyRequirements(
    companyName: string,
    role: string
): Promise<CompanyRequirements> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert ATS/hiring analyst. Generate the ATS requirements for a specific company and role. Return ONLY valid JSON with no extra text.

Response format:
{
  "required_skills": ["skill1", "skill2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "project_expectations": "description of what projects are expected",
  "min_experience_months": 0,
  "preferred_sections": ["Education", "Skills", "Projects", "Experience"]
}

Rules:
- required_skills: List 8-15 specific technical skills this company looks for in this role
- keywords: List 10-15 industry/role keywords that ATS systems scan for
- project_expectations: What kind of projects does this company value?
- min_experience_months: Typical minimum experience (0 for fresh grads)
- preferred_sections: What resume sections matter most for this company`,
                },
                {
                    role: "user",
                    content: `Generate ATS requirements for: Company: ${companyName}, Role: ${role}. Consider this company's actual hiring patterns, tech stack, and culture. Return only the JSON.`,
                },
            ],
            temperature: 0.5,
            max_tokens: 800,
            response_format: { type: "json_object" },
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) throw new Error("Empty response");

        const parsed = JSON.parse(response);

        const companyId = `custom_${companyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

        // Save to DB for future use
        try {
            await pool.execute(
                `INSERT IGNORE INTO company_resume_requirements
         (company_id, company_name, role, required_skills, keywords, project_expectations, min_experience_months, preferred_sections)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    companyId,
                    companyName,
                    role,
                    JSON.stringify(parsed.required_skills || []),
                    JSON.stringify(parsed.keywords || []),
                    parsed.project_expectations || "",
                    parsed.min_experience_months || 0,
                    JSON.stringify(parsed.preferred_sections || ["Education", "Skills", "Projects", "Experience"]),
                ]
            );
        } catch (e) {
            console.warn("[Analyze] Could not cache AI-generated requirements:", e);
        }

        return {
            company_id: companyId,
            company_name: companyName,
            role,
            required_skills: parsed.required_skills || [],
            keywords: parsed.keywords || [],
            project_expectations: parsed.project_expectations || "",
            min_experience_months: parsed.min_experience_months || 0,
            preferred_sections: parsed.preferred_sections || ["Education", "Skills", "Projects", "Experience"],
        };
    } catch (e) {
        console.error("[Analyze] AI requirements generation failed:", e);
        // Fallback: generic requirements
        return {
            company_id: `custom_${companyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
            company_name: companyName,
            role,
            required_skills: ["data structures", "algorithms", "problem solving", "programming"],
            keywords: ["programming", "data structures", "algorithms", "databases", "web development"],
            project_expectations: "Strong project work with measurable outcomes",
            min_experience_months: 0,
            preferred_sections: ["Education", "Skills", "Projects", "Experience"],
        };
    }
}

export async function POST(req: NextRequest) {
    try {
        // 1. Auth check
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { resumeId, companyId, companyName, targetRole } = body;

        if (!resumeId || !targetRole) {
            return NextResponse.json(
                { error: "Missing required fields: resumeId, targetRole" },
                { status: 400 }
            );
        }

        if (!companyId && !companyName) {
            return NextResponse.json(
                { error: "Missing required field: companyId or companyName" },
                { status: 400 }
            );
        }

        // 3. Fetch resume
        const [resumes]: any = await pool.execute(
            "SELECT * FROM resumes WHERE id = ? AND student_id = ?",
            [resumeId, user.id]
        );

        if (resumes.length === 0) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        const resume = resumes[0];
        let resumeText = resume.parsed_text || "";

        // Check if parsed_text is empty, too short, or looks like garbage from broken parser
        const isTextUsable = (text: string) => {
            if (!text || text.trim().length < 100) return false;
            // If more than 30% of chars are non-printable/non-ASCII, text is likely garbage
            const nonPrintable = text.replace(/[\x20-\x7E\n\r\t]/g, "").length;
            if (nonPrintable / text.length > 0.3) return false;
            return true;
        };

        if (!isTextUsable(resumeText)) {
            console.log("[Analyze] Parsed text is empty/corrupt, re-parsing from Cloudinary...");
            try {
                const fileRes = await fetch(resume.file_url);
                const arrayBuffer = await fileRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                resumeText = await parseResume(buffer, resume.file_type);

                // Update the DB with the properly parsed text
                if (resumeText && resumeText.trim().length > 0) {
                    await pool.execute(
                        "UPDATE resumes SET parsed_text = ? WHERE id = ?",
                        [resumeText, resume.id]
                    );
                    console.log("[Analyze] Re-parsed and saved text successfully, length:", resumeText.length);
                }
            } catch (parseErr) {
                console.error("[Analyze] Re-parse failed:", parseErr);
            }
        }

        if (!resumeText || resumeText.trim().length === 0) {
            return NextResponse.json(
                { error: "Resume text could not be extracted. Please re-upload your resume." },
                { status: 400 }
            );
        }

        // 4. Get or generate company requirements
        await seedCompanyRequirements();

        let companyReqs: CompanyRequirements | null = null;

        // Try to find in DB by companyId first
        if (companyId && companyId !== "custom") {
            const requirements = await getCompanyRequirements(companyId, targetRole);
            if (requirements) {
                companyReqs = {
                    company_id: requirements.company_id,
                    company_name: requirements.company_name,
                    role: targetRole,
                    required_skills: requirements.required_skills || [],
                    keywords: requirements.keywords || [],
                    project_expectations: requirements.project_expectations || "",
                    min_experience_months: requirements.min_experience_months || 0,
                    preferred_sections: requirements.preferred_sections || [],
                };
            } else {
                // Try to find by company_id alone (any role)
                const [anyRole]: any = await pool.execute(
                    "SELECT * FROM company_resume_requirements WHERE company_id = ? LIMIT 1",
                    [companyId]
                );
                if (anyRole.length > 0) {
                    const row = anyRole[0];
                    companyReqs = {
                        company_id: row.company_id,
                        company_name: row.company_name,
                        role: targetRole,
                        required_skills: typeof row.required_skills === "string" ? JSON.parse(row.required_skills) : row.required_skills || [],
                        keywords: typeof row.keywords === "string" ? JSON.parse(row.keywords) : row.keywords || [],
                        project_expectations: row.project_expectations || "",
                        min_experience_months: row.min_experience_months || 0,
                        preferred_sections: typeof row.preferred_sections === "string" ? JSON.parse(row.preferred_sections) : row.preferred_sections || [],
                    };
                }
            }
        }

        // If still no requirements, check for on-campus company from placements table
        if (!companyReqs && companyId && companyId.startsWith("placement_")) {
            const placementId = companyId.replace("placement_", "");
            const [placements]: any = await pool.execute(
                "SELECT company_name, role, eligibility FROM placements WHERE id = ?",
                [placementId]
            );
            if (placements.length > 0) {
                const placement = placements[0];
                // Generate requirements using company info from placements
                const resolvedName = companyName || placement.company_name;
                const resolvedRole = targetRole || placement.role || "SDE";
                companyReqs = await generateCompanyRequirements(resolvedName, resolvedRole);
            }
        }

        // If still no requirements, generate via AI (handles Google, Microsoft, etc.)
        if (!companyReqs) {
            const resolvedName = companyName || companyId || "Unknown Company";
            companyReqs = await generateCompanyRequirements(resolvedName, targetRole);
        }

        // 5. Run rule-based ATS scoring
        const atsResult = calculateATSScore(resumeText, companyReqs);

        // 6. Fetch student profile for AI context
        const [students]: any = await pool.execute(
            `SELECT first_name, last_name, current_year, program, current_gpa,
              technical_skills, college
       FROM students WHERE student_id = ?`,
            [user.id]
        );

        const studentProfile = students[0] || {};
        let techSkills: string[] = [];
        try {
            if (studentProfile.technical_skills) {
                const parsed = typeof studentProfile.technical_skills === "string"
                    ? JSON.parse(studentProfile.technical_skills)
                    : studentProfile.technical_skills;
                techSkills = Array.isArray(parsed) ? parsed : [];
            }
        } catch { techSkills = []; }

        const studentContext: StudentContext = {
            name: `${studentProfile.first_name || ""} ${studentProfile.last_name || ""}`.trim() || user.name,
            year: studentProfile.current_year || null,
            program: studentProfile.program || null,
            gpa: studentProfile.current_gpa || null,
            technicalSkills: techSkills,
            college: studentProfile.college || null,
        };

        // 7. Generate AI feedback
        const aiFeedback = await generateAIFeedback(
            resumeText,
            atsResult,
            companyReqs,
            studentContext
        );

        // 8. Save analysis to database
        const [insertResult]: any = await pool.execute(
            `INSERT INTO resume_analyses
       (resume_id, student_id, company_name, company_id, target_role,
        ats_score, section_scores, feedback_json, rejection_reasons,
        skill_gaps, improvement_steps)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                resumeId,
                user.id,
                companyReqs.company_name,
                companyReqs.company_id,
                targetRole,
                atsResult.totalScore,
                JSON.stringify(atsResult.sectionScores),
                JSON.stringify(aiFeedback),
                JSON.stringify(aiFeedback.rejectionReasons),
                JSON.stringify(aiFeedback.skillGapAnalysis),
                JSON.stringify(aiFeedback.improvementSteps),
            ]
        );

        // 9. Return full analysis
        return NextResponse.json({
            success: true,
            analysis: {
                id: insertResult.insertId,
                resume_id: resumeId,
                company_name: companyReqs.company_name,
                company_id: companyReqs.company_id,
                target_role: targetRole,
                ats_score: atsResult.totalScore,
                section_scores: atsResult.sectionScores,
                matched_skills: atsResult.matchedSkills,
                missing_skills: atsResult.missingSkills,
                matched_keywords: atsResult.matchedKeywords,
                missing_keywords: atsResult.missingKeywords,
                rejection_reasons: aiFeedback.rejectionReasons,
                skill_gaps: aiFeedback.skillGapAnalysis,
                improvement_steps: aiFeedback.improvementSteps,
                bullet_suggestions: aiFeedback.bulletSuggestions,
                overall_verdict: aiFeedback.overallVerdict,
                created_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("[Resume Analyze] Error:", error);
        return NextResponse.json(
            { error: "Analysis failed: " + (error as Error).message },
            { status: 500 }
        );
    }
}
