/**
 * GET /api/resume/companies
 *
 * Returns available companies and roles for resume analysis.
 * Sources:
 * 1. Static off-campus companies from companies.ts
 * 2. On-campus placements from the placements DB table
 * 3. Popular companies (hardcoded list for quick selection)
 *
 * Auth: Student only.
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { offCampusCompanies, onCampusPrograms } from "@/lib/career-tracks/companies";
import { seedCompanyRequirements } from "@/lib/resume/requirements-seed";
import pool from "@/lib/db";

// Popular companies that students commonly target
const POPULAR_COMPANIES = [
    { id: "custom_google", name: "Google", roles: ["SDE", "SWE", "ML Engineer", "Data Analyst"] },
    { id: "custom_microsoft", name: "Microsoft", roles: ["SDE", "SWE", "PM", "Data Scientist"] },
    { id: "custom_amazon", name: "Amazon", roles: ["SDE", "SWE", "Data Engineer", "DevOps Engineer"] },
    { id: "custom_apple", name: "Apple", roles: ["SDE", "iOS Developer", "ML Engineer"] },
    { id: "custom_meta", name: "Meta", roles: ["SDE", "SWE", "ML Engineer", "Data Scientist"] },
    { id: "custom_netflix", name: "Netflix", roles: ["SDE", "SWE", "Data Engineer"] },
    { id: "custom_flipkart", name: "Flipkart", roles: ["SDE", "Backend Engineer", "Data Analyst"] },
    { id: "custom_uber", name: "Uber", roles: ["SDE", "SWE", "Backend Engineer"] },
    { id: "custom_adobe", name: "Adobe", roles: ["SDE", "SWE", "MTS", "Research Engineer"] },
    { id: "custom_salesforce", name: "Salesforce", roles: ["SDE", "SWE", "MTS"] },
    { id: "custom_goldman_sachs", name: "Goldman Sachs", roles: ["Analyst", "SDE", "Quant Developer"] },
    { id: "custom_jpmorgan", name: "JP Morgan", roles: ["SDE", "Analyst", "Quant Developer"] },
    { id: "custom_deloitte", name: "Deloitte", roles: ["Analyst", "Consultant", "SDE"] },
    { id: "custom_oracle", name: "Oracle", roles: ["SDE", "Application Developer", "MTS"] },
    { id: "custom_samsung", name: "Samsung", roles: ["SDE", "Embedded Engineer", "Research Engineer"] },
];

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "student") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Ensure requirements are seeded
        await seedCompanyRequirements();

        // 1. Get on-campus placements from DB
        let onCampusPlacements: any[] = [];
        try {
            const collegeId = user.college_id;
            let query = "SELECT id, company_name, role, eligibility FROM placements";
            const params: any[] = [];
            if (collegeId) {
                query += " WHERE college_id = ?";
                params.push(collegeId);
            }
            query += " ORDER BY company_name";

            const [rows]: any = await pool.execute(query, params);
            onCampusPlacements = rows.map((p: any) => ({
                id: `placement_${p.id}`,
                companyName: p.company_name,
                roleTitle: p.role || "SDE",
                source: "on-campus",
            }));
        } catch (e) {
            console.warn("[Resume Companies] Could not fetch placements:", e);
        }

        // 2. Build response with all 3 sources
        return NextResponse.json({
            success: true,
            data: {
                // Static off-campus companies
                offCampus: offCampusCompanies.map((c) => ({
                    id: c.id,
                    name: c.name,
                    roleType: c.roleType || "SDE",
                    logo: c.logo,
                    source: "off-campus",
                })),
                // Static on-campus programs
                onCampus: [
                    // From static data
                    ...onCampusPrograms.map((p) => ({
                        id: p.id,
                        companyName: p.companyName,
                        roleTitle: p.roleTitle,
                        source: "on-campus-static",
                    })),
                    // From placements DB
                    ...onCampusPlacements,
                ],
                // Popular companies (AI-powered requirements on first use)
                popular: POPULAR_COMPANIES,
            },
        });
    } catch (error) {
        console.error("[Resume Companies] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch companies" },
            { status: 500 }
        );
    }
}
