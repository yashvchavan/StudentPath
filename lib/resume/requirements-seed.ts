/**
 * Company Resume Requirements Seed
 *
 * Seeds the `company_resume_requirements` table from existing static
 * company data in lib/career-tracks/companies.ts.
 * This runs once on first API call if the table is empty.
 */

import pool from "@/lib/db";
import { offCampusCompanies, onCampusPrograms } from "@/lib/career-tracks/companies";

/**
 * Role-specific keyword mapping.
 * These keywords are what ATS systems typically scan for each role type.
 */
const ROLE_KEYWORDS: Record<string, string[]> = {
    SDE: [
        "data structures", "algorithms", "system design", "object oriented",
        "REST API", "microservices", "git", "agile", "CI/CD", "testing",
        "scalable", "performance", "debugging", "code review", "clean code",
    ],
    Analyst: [
        "data analysis", "SQL", "Excel", "visualization", "reporting",
        "business intelligence", "tableau", "power bi", "statistics",
        "problem solving", "stakeholder", "requirements gathering",
    ],
    "Associate Software Engineer": [
        "programming", "data structures", "algorithms", "databases",
        "web development", "problem solving", "teamwork", "agile",
        "testing", "debugging", "version control",
    ],
    "Member Technical Staff": [
        "programming", "data structures", "algorithms", "C",
        "problem solving", "logic", "system design", "debugging",
        "optimization", "clean code",
    ],
    "System Engineer": [
        "programming", "databases", "SQL", "problem solving",
        "communication", "teamwork", "agile", "testing", "debugging",
    ],
    "Systems Engineer": [
        "programming", "databases", "SQL", "problem solving",
        "communication", "teamwork", "agile", "testing",
    ],
    "Project Engineer": [
        "programming", "databases", "SQL", "problem solving",
        "communication", "aptitude", "teamwork",
    ],
    "Programmer Analyst": [
        "programming", "data structures", "databases", "SQL",
        "problem solving", "algorithms", "web development", "agile",
    ],
    default: [
        "programming", "data structures", "algorithms", "problem solving",
        "communication", "teamwork", "databases", "web development",
    ],
};

/**
 * Role-specific project expectations.
 */
const ROLE_PROJECT_EXPECTATIONS: Record<string, string> = {
    SDE: "Expects 2-3 well-documented projects showcasing system design, scalability, and clean code practices. Projects should use modern frameworks and include quantified outcomes.",
    Analyst: "Expects 1-2 data-driven projects demonstrating SQL proficiency, data visualization, and business insight generation.",
    default: "Expects at least 2 projects showing practical application of programming skills with clear descriptions and tech stack details.",
};

/**
 * Seed company requirements from existing static data.
 * Inserts only if the table is empty or specific company+role combo doesn't exist.
 */
export async function seedCompanyRequirements(): Promise<void> {
    const connection = await pool.getConnection();
    try {
        // Check if already seeded
        const [existing]: any = await connection.execute(
            "SELECT COUNT(*) as count FROM company_resume_requirements"
        );
        if (existing[0].count > 0) {
            return; // Already seeded
        }

        console.log("[Seed] Seeding company resume requirements...");

        // Seed from off-campus companies
        for (const company of offCampusCompanies) {
            const roleType = company.roleType;
            const keywords = ROLE_KEYWORDS[roleType] || ROLE_KEYWORDS.default;
            const projectExp = ROLE_PROJECT_EXPECTATIONS[roleType] || ROLE_PROJECT_EXPECTATIONS.default;

            await connection.execute(
                `INSERT IGNORE INTO company_resume_requirements
         (company_id, company_name, role, required_skills, keywords, project_expectations, min_experience_months, preferred_sections)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    company.id,
                    company.name,
                    roleType,
                    JSON.stringify(company.requiredSkills),
                    JSON.stringify(keywords),
                    projectExp,
                    0, // Fresh graduates
                    JSON.stringify(["Education", "Skills", "Projects", "Experience", "Certifications"]),
                ]
            );
        }

        // Seed from on-campus programs
        for (const program of onCampusPrograms) {
            const roleTitle = program.roleTitle;
            const keywords = ROLE_KEYWORDS[roleTitle] || ROLE_KEYWORDS.default;
            const projectExp = ROLE_PROJECT_EXPECTATIONS.default;

            await connection.execute(
                `INSERT IGNORE INTO company_resume_requirements
         (company_id, company_name, role, required_skills, keywords, project_expectations, min_experience_months, preferred_sections)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    program.id,
                    program.companyName,
                    roleTitle,
                    JSON.stringify(program.requiredSkills),
                    JSON.stringify(keywords),
                    projectExp,
                    0,
                    JSON.stringify(["Education", "Skills", "Projects", "Experience"]),
                ]
            );
        }

        console.log("[Seed] Company resume requirements seeded successfully.");
    } finally {
        connection.release();
    }
}

/**
 * Get company requirements for a specific company_id and role.
 * Returns null if not found.
 */
export async function getCompanyRequirements(
    companyId: string,
    role: string
): Promise<any | null> {
    const [rows]: any = await pool.execute(
        "SELECT * FROM company_resume_requirements WHERE company_id = ? AND role = ? LIMIT 1",
        [companyId, role]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        ...row,
        required_skills: typeof row.required_skills === "string" ? JSON.parse(row.required_skills) : row.required_skills,
        keywords: typeof row.keywords === "string" ? JSON.parse(row.keywords) : row.keywords,
        preferred_sections: typeof row.preferred_sections === "string" ? JSON.parse(row.preferred_sections) : row.preferred_sections,
    };
}

/**
 * Get all available companies with their requirements.
 */
export async function getAllCompanyRequirements(): Promise<any[]> {
    const [rows]: any = await pool.execute(
        "SELECT company_id, company_name, role FROM company_resume_requirements ORDER BY company_name"
    );
    return rows;
}
