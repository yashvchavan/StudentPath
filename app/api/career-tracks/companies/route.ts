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

        const mapped = placements.map(p => ({
            id: p.id,
            companyName: p.company_name,
            logo: p.logo_url || "🏢", // Default emoji if no logo
            roleTitle: p.role || "Not Specified",
            package: p.package,
            eligibilityCriteria: p.eligibility,
            driveDate: p.drive_date ? new Date(p.drive_date).toISOString() : null,
            registrationDeadline: p.deadline ? new Date(p.deadline).toISOString() : (p.drive_date ? new Date(p.drive_date).toISOString() : null),
            status: getStatus(p.drive_date),
            requiredSkills: [], // Not in Excel
            rounds: [], // Not in Excel
            totalApplicants: p.students_registered,
            academicYear: p.academic_year // New field
        }));

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
