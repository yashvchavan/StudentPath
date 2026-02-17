import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPlacements } from "@/lib/placementRepository";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser();

        // Allow students and admins to view
        if (!user) {
            console.log("[Companies API] Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        let collegeId = user.college_id;

        // If student has college_id in their profile
        if (user.role === 'student' && user.college_id) {
            collegeId = user.college_id;
        }

        // DEBUG LOG
        console.log(`[Companies API] User: ${user.email}, Role: ${user.role}, Filter CollegeId: ${collegeId}`);

        const placements = await getPlacements(collegeId);
        console.log(`[Companies API] Found ${placements.length} placements in DB`);

        const mapped = placements.map(p => {
            // Parse JSON fields if they're strings
            let extractedSkills = [];
            let extractedRounds = [];

            try {
                if (p.extracted_skills) {
                    extractedSkills = typeof p.extracted_skills === 'string'
                        ? JSON.parse(p.extracted_skills)
                        : p.extracted_skills;
                }
            } catch (e) {
                console.error('Error parsing extracted_skills:', e);
            }

            try {
                if (p.extracted_rounds) {
                    extractedRounds = typeof p.extracted_rounds === 'string'
                        ? JSON.parse(p.extracted_rounds)
                        : p.extracted_rounds;
                }
            } catch (e) {
                console.error('Error parsing extracted_rounds:', e);
            }

            return {
                id: p.id,
                companyName: p.company_name,
                logo: p.logo_url || "🏢", // Default emoji if no logo
                roleTitle: p.role || "Not Specified",
                package: p.package,
                eligibilityCriteria: p.eligibility,
                driveDate: p.drive_date ? new Date(p.drive_date).toISOString() : null,
                registrationDeadline: p.deadline ? new Date(p.deadline).toISOString() : (p.drive_date ? new Date(p.drive_date).toISOString() : null),
                status: getStatus(p.drive_date),
                requiredSkills: extractedSkills.length > 0 ? extractedSkills : [], // Use AI-extracted or empty
                rounds: extractedRounds.length > 0 ? extractedRounds : [], // Use AI-extracted or empty
                totalApplicants: p.students_registered,
                academicYear: p.academic_year,
                // AI-extracted fields
                extracted_skills: extractedSkills,
                extracted_rounds: extractedRounds,
                difficulty_level: p.difficulty_level,
                total_rounds: p.total_rounds,
                ai_confidence_score: p.ai_confidence_score,
                last_ai_update: p.last_ai_update
            };
        });

        console.log(`[Companies API] Returning ${mapped.length} mapped placements`);

        return NextResponse.json({
            success: true,
            data: {
                onCampus: mapped,
                offCampus: []
            }
        });

    } catch (error) {
        console.error("Get placements error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

function getStatus(driveDate?: string) {
    if (!driveDate) return "Upcoming";
    const date = new Date(driveDate);
    const now = new Date();
    if (date < now) return "Completed";
    return "Upcoming";
}
