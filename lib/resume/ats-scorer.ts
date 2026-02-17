/**
 * ATS Scoring Engine
 * 
 * Rule-based resume scoring against company-specific requirements.
 * Scoring breakdown (100 points total):
 *   - Skills Match:    30 pts — required skills found in resume
 *   - Keywords Match:  20 pts — role-specific keywords detected
 *   - Projects:        20 pts — project descriptions, tech mentions, quantified outcomes
 *   - Experience:      15 pts — work experience, internships, durations
 *   - Structure:       15 pts — essential sections present (Education, Skills, etc.)
 */

export interface CompanyRequirements {
    company_id: string;
    company_name: string;
    role: string;
    required_skills: string[];
    keywords: string[];
    project_expectations: string;
    min_experience_months: number;
    preferred_sections: string[];
}

export interface SectionScore {
    name: string;
    score: number;
    maxScore: number;
    details: string;
}

export interface ATSScoreResult {
    totalScore: number;
    sectionScores: SectionScore[];
    matchedSkills: string[];
    missingSkills: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
}

/**
 * Normalize text for case-insensitive matching.
 * Handles common variations (e.g., "c++" vs "C++", "node.js" vs "nodejs").
 */
function normalizeText(text: string): string {
    return text.toLowerCase().replace(/[.\-_]/g, "").replace(/\s+/g, " ");
}

/**
 * Check if a skill/keyword exists in the resume text.
 * Uses fuzzy matching to handle variations.
 */
function textContains(resumeNormalized: string, term: string): boolean {
    const normalizedTerm = normalizeText(term);
    // Direct match
    if (resumeNormalized.includes(normalizedTerm)) return true;

    // Handle common abbreviations and variations
    const variations: Record<string, string[]> = {
        "javascript": ["js", "javascript", "ecmascript"],
        "typescript": ["ts", "typescript"],
        "python": ["python", "py"],
        "nodejs": ["nodejs", "node", "expressjs", "express"],
        "reactjs": ["react", "reactjs", "nextjs"],
        "mongodb": ["mongodb", "mongo"],
        "postgresql": ["postgresql", "postgres", "psql"],
        "mysql": ["mysql", "sql"],
        "cplusplus": ["c++", "cpp", "cplusplus"],
        "csharp": ["c#", "csharp"],
        "machinelearning": ["machine learning", "ml", "deep learning", "dl"],
        "datastructures": ["data structures", "dsa", "algorithms"],
        "systemdesign": ["system design", "hld", "lld", "architecture"],
        "restapis": ["rest api", "restful", "api development"],
        "amazonwebservices": ["aws", "amazon web services"],
        "googlecloudplatform": ["gcp", "google cloud"],
        "microsoftazure": ["azure", "microsoft azure"],
        "objectoriented": ["oop", "object oriented", "oops"],
        "problemsolving": ["problem solving", "competitive programming", "cp"],
        "communication": ["communication", "soft skills", "interpersonal"],
    };

    for (const [, alts] of Object.entries(variations)) {
        if (alts.some((a) => normalizeText(a) === normalizedTerm)) {
            return alts.some((a) => resumeNormalized.includes(normalizeText(a)));
        }
    }

    return false;
}

/**
 * Score: Skills Match (0-30 points)
 * Checks how many required skills are present in the resume.
 */
function scoreSkills(
    resumeNormalized: string,
    requiredSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
    if (requiredSkills.length === 0) return { score: 30, matched: [], missing: [] };

    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of requiredSkills) {
        if (textContains(resumeNormalized, skill)) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    }

    const ratio = matched.length / requiredSkills.length;
    const score = Math.round(ratio * 30);

    return { score, matched, missing };
}

/**
 * Score: Keywords Match (0-20 points)
 * Checks for role-specific and industry keywords.
 */
function scoreKeywords(
    resumeNormalized: string,
    keywords: string[]
): { score: number; matched: string[]; missing: string[] } {
    if (keywords.length === 0) return { score: 20, matched: [], missing: [] };

    const matched: string[] = [];
    const missing: string[] = [];

    for (const keyword of keywords) {
        if (textContains(resumeNormalized, keyword)) {
            matched.push(keyword);
        } else {
            missing.push(keyword);
        }
    }

    const ratio = matched.length / keywords.length;
    const score = Math.round(ratio * 20);

    return { score, matched, missing };
}

/**
 * Score: Projects Section (0-20 points)
 * Evaluates project descriptions for quality indicators:
 * - Has project section (5 pts)
 * - Mentions tech stack in projects (5 pts)
 * - Has quantified outcomes/metrics (5 pts)
 * - Has multiple projects (5 pts)
 */
function scoreProjects(resumeNormalized: string): SectionScore {
    let score = 0;
    const details: string[] = [];

    // Check for project section
    const projectHeaders = ["projects", "project work", "personal projects", "academic projects", "key projects"];
    const hasProjectSection = projectHeaders.some((h) => resumeNormalized.includes(h));
    if (hasProjectSection) {
        score += 5;
        details.push("Project section found");
    } else {
        details.push("No dedicated project section detected");
    }

    // Check for tech stack mentions in project context
    const techIndicators = ["built with", "developed using", "tech stack", "technologies used",
        "implemented", "using react", "using python", "using java", "using node",
        "built a", "developed a", "created a", "designed a"];
    const hasTechMentions = techIndicators.some((t) => resumeNormalized.includes(t));
    if (hasTechMentions) {
        score += 5;
        details.push("Tech stack mentioned in projects");
    } else {
        details.push("No tech stack details in projects");
    }

    // Check for quantified outcomes
    const quantifiers = /\d+%|\d+x|\d+ users|\d+ requests|\d+k|\d+ transactions|\d+ downloads|reduced by|improved by|increased by|scaled to/;
    if (quantifiers.test(resumeNormalized)) {
        score += 5;
        details.push("Quantified outcomes found");
    } else {
        details.push("No quantified outcomes (add metrics like '30% improvement')");
    }

    // Check for multiple projects
    const projectCount = (resumeNormalized.match(/(?:project|built|developed|created|designed)\s+(?:a\s+)?/g) || []).length;
    if (projectCount >= 2) {
        score += 5;
        details.push(`${projectCount} projects detected`);
    } else {
        details.push("Consider adding more projects (aim for 2-3)");
    }

    return { name: "Projects", score, maxScore: 20, details: details.join("; ") };
}

/**
 * Score: Experience Section (0-15 points)
 * Evaluates work experience quality:
 * - Has experience/internship section (5 pts)
 * - Mentions durations/dates (5 pts)
 * - Has action verbs (5 pts)
 */
function scoreExperience(resumeNormalized: string): SectionScore {
    let score = 0;
    const details: string[] = [];

    // Check for experience section
    const expHeaders = ["experience", "work experience", "professional experience", "internship", "internships", "employment"];
    const hasExpSection = expHeaders.some((h) => resumeNormalized.includes(h));
    if (hasExpSection) {
        score += 5;
        details.push("Experience section found");
    } else {
        details.push("No experience/internship section detected");
    }

    // Check for duration mentions
    const durationPatterns = /\d{4}\s*[-–]\s*(?:\d{4}|present|current|ongoing)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}|\d+\s*(?:months?|years?)/i;
    if (durationPatterns.test(resumeNormalized)) {
        score += 5;
        details.push("Duration/dates mentioned");
    } else {
        details.push("No work durations found (add dates)");
    }

    // Check for action verbs
    const actionVerbs = ["developed", "implemented", "designed", "managed", "led", "optimized",
        "built", "architected", "deployed", "automated", "collaborated", "mentored",
        "analyzed", "integrated", "resolved", "delivered", "spearheaded"];
    const foundVerbs = actionVerbs.filter((v) => resumeNormalized.includes(v));
    if (foundVerbs.length >= 3) {
        score += 5;
        details.push(`Strong action verbs used (${foundVerbs.length} found)`);
    } else if (foundVerbs.length > 0) {
        score += 2;
        details.push(`Few action verbs (${foundVerbs.length}). Use more: led, optimized, built...`);
    } else {
        details.push("No action verbs found. Start bullets with: Developed, Led, Built...");
    }

    return { name: "Experience", score, maxScore: 15, details: details.join("; ") };
}

/**
 * Score: Structure / Formatting (0-15 points)
 * Checks for essential resume sections:
 * - Education (4 pts)
 * - Skills (4 pts)
 * - Contact info (4 pts)
 * - Consistent formatting indicators (3 pts)
 */
function scoreStructure(resumeNormalized: string): SectionScore {
    let score = 0;
    const details: string[] = [];

    // Education section
    const eduIndicators = ["education", "bachelor", "master", "b.tech", "b.e.", "btech", "mtech",
        "degree", "university", "college", "cgpa", "gpa", "percentage"];
    if (eduIndicators.some((e) => resumeNormalized.includes(e))) {
        score += 4;
        details.push("Education section found");
    } else {
        details.push("No education section detected");
    }

    // Skills section
    const skillIndicators = ["skills", "technical skills", "core competencies", "proficiencies",
        "technologies", "tools", "frameworks"];
    if (skillIndicators.some((s) => resumeNormalized.includes(s))) {
        score += 4;
        details.push("Skills section found");
    } else {
        details.push("No dedicated skills section");
    }

    // Contact information
    const contactIndicators = ["email", "phone", "linkedin", "github", "@", ".com"];
    const contactCount = contactIndicators.filter((c) => resumeNormalized.includes(c)).length;
    if (contactCount >= 3) {
        score += 4;
        details.push("Contact information present");
    } else if (contactCount >= 1) {
        score += 2;
        details.push("Partial contact info (add LinkedIn/GitHub)");
    } else {
        details.push("No contact information detected");
    }

    // Formatting consistency (checking for structured content)
    const sections = ["education", "experience", "skills", "projects", "certifications", "achievements"];
    const foundSections = sections.filter((s) => resumeNormalized.includes(s));
    if (foundSections.length >= 4) {
        score += 3;
        details.push(`Well-structured (${foundSections.length} sections)`);
    } else if (foundSections.length >= 2) {
        score += 1;
        details.push(`Basic structure (${foundSections.length} sections). Add more sections.`);
    } else {
        details.push("Poor structure. Add clear section headings.");
    }

    return { name: "Structure", score, maxScore: 15, details: details.join("; ") };
}

/**
 * Main ATS scoring function.
 * Evaluates a resume against company-specific requirements.
 */
export function calculateATSScore(
    resumeText: string,
    requirements: CompanyRequirements
): ATSScoreResult {
    const resumeNormalized = normalizeText(resumeText);

    // 1. Skills (30 pts)
    const skillsResult = scoreSkills(resumeNormalized, requirements.required_skills);
    const skillsSection: SectionScore = {
        name: "Skills Match",
        score: skillsResult.score,
        maxScore: 30,
        details: `Matched ${skillsResult.matched.length}/${requirements.required_skills.length} required skills`,
    };

    // 2. Keywords (20 pts)
    const keywordsResult = scoreKeywords(resumeNormalized, requirements.keywords);
    const keywordsSection: SectionScore = {
        name: "Keywords",
        score: keywordsResult.score,
        maxScore: 20,
        details: `Matched ${keywordsResult.matched.length}/${requirements.keywords.length} keywords`,
    };

    // 3. Projects (20 pts)
    const projectsSection = scoreProjects(resumeNormalized);

    // 4. Experience (15 pts)
    const experienceSection = scoreExperience(resumeNormalized);

    // 5. Structure (15 pts)
    const structureSection = scoreStructure(resumeNormalized);

    const sectionScores = [skillsSection, keywordsSection, projectsSection, experienceSection, structureSection];
    const totalScore = sectionScores.reduce((sum, s) => sum + s.score, 0);

    return {
        totalScore,
        sectionScores,
        matchedSkills: skillsResult.matched,
        missingSkills: skillsResult.missing,
        matchedKeywords: keywordsResult.matched,
        missingKeywords: keywordsResult.missing,
    };
}
