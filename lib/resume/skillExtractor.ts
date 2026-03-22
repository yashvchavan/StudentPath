/**
 * Resume Skill Extractor — lib/resume/skillExtractor.ts
 *
 * Uses OpenAI (gpt-4o-mini) with response_format: json_object to deterministically
 * extract a structured skill profile from raw resume plain-text.
 *
 * Design goals:
 *  - Deterministic: temperature=0, response_format=json_object, exact schema in prompt
 *  - Token-efficient: resume text pre-cleaned and capped at 3 500 chars
 *  - Noise-tolerant: noisy OCR / parser text is normalised before sending
 *  - Graceful fallback: returns empty arrays on any OpenAI failure
 */

import OpenAI from "openai";

// ─── OpenAI client (reuses OPENAI_API_KEY from env) ──────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Max chars of resume text to feed to the model (token budget) ─────────────
const MAX_RESUME_CHARS = 3500;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectEntry {
  name: string;
  description: string;
  techUsed: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string | null;
  year: string | null;
}

/** Full structured skill profile extracted from a resume. */
export interface ResumeSkillProfile {
  technical_skills: string[];   // e.g. ["Python", "TypeScript", "SQL"]
  frameworks: string[];         // e.g. ["React", "Next.js", "FastAPI"]
  tools: string[];              // e.g. ["Docker", "Git", "VS Code", "Postman"]
  soft_skills: string[];        // e.g. ["Communication", "Team Leadership"]
  projects: ProjectEntry[];     // structured project entries
  certifications: CertificationEntry[];
}

// ─── Text pre-processing ──────────────────────────────────────────────────────

/**
 * Clean noisy resume text before sending to the model.
 *
 * Handles common issues from PDF/DOCX parsers:
 *  - Repeated whitespace / blank lines
 *  - Stray unicode bullets / special characters
 *  - Invisible zero-width chars from PDF extraction
 *  - Excessive line breaks (OCR-style output)
 */
export function cleanResumeText(raw: string): string {
  return raw
    // Remove zero-width and other invisible unicode chars
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    // Replace unicode bullets, dashes and decorators with a plain hyphen
    .replace(/[•·▪▸►‣⁃–—]/g, "-")
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    // Collapse multiple spaces/tabs to a single space
    .replace(/[ \t]{2,}/g, " ")
    // Remove form-feed and carriage return
    .replace(/[\r\f]/g, "")
    .trim()
    // Hard cap — take first MAX_RESUME_CHARS characters
    .slice(0, MAX_RESUME_CHARS);
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precision resume parser. Your only task is to extract structured information from resume text.

RULES:
1. Return ONLY a valid JSON object matching the exact schema below. No markdown, no extra keys, no explanation.
2. All array values must be concise strings (no sentences for skill names).
3. De-duplicate — each item must appear in at most ONE category.
4. If a section has no data, return an empty array [].
5. For projects: extract name, a one-line description, and the tech stack used.
6. For certifications: extract name, issuer (or null), and year (4-digit string or null).
7. Soft skills must be genuine interpersonal/professional traits (e.g., "Leadership"), NOT technical skills. If no soft skills are explicitly listed, aggressively infer them (e.g. Communication, Teamwork, Leadership, Problem Solving) by analyzing the descriptions of their projects, co-curriculars, and extra-curriculars.

REQUIRED JSON SCHEMA:
{
  "technical_skills": ["string"],
  "frameworks": ["string"],
  "tools": ["string"],
  "soft_skills": ["string"],
  "projects": [
    { "name": "string", "description": "string", "techUsed": ["string"] }
  ],
  "certifications": [
    { "name": "string", "issuer": "string|null", "year": "string|null" }
  ]
}`;

function buildUserPrompt(cleanedText: string): string {
  return `Extract the skill profile from the following resume text. Follow the schema exactly.

RESUME TEXT:
${cleanedText}

Return ONLY the JSON object. No other text.`;
}

// ─── Default fallback ─────────────────────────────────────────────────────────

function emptyProfile(): ResumeSkillProfile {
  return {
    technical_skills: [],
    frameworks: [],
    tools: [],
    soft_skills: [],
    projects: [],
    certifications: [],
  };
}

// ─── Schema validator / sanitizer ─────────────────────────────────────────────

/**
 * Ensures the parsed object conforms to ResumeSkillProfile.
 * Coerces wrong types to safe defaults instead of throwing.
 */
function sanitizeProfile(raw: Partial<ResumeSkillProfile>): ResumeSkillProfile {
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

  const asProjectArray = (v: unknown): ProjectEntry[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((p) => p && typeof p === "object")
      .map((p: any) => ({
        name: typeof p.name === "string" ? p.name : "",
        description: typeof p.description === "string" ? p.description : "",
        techUsed: Array.isArray(p.techUsed)
          ? p.techUsed.filter((t: unknown) => typeof t === "string")
          : [],
      }))
      .filter((p) => p.name.length > 0);
  };

  const asCertArray = (v: unknown): CertificationEntry[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((c) => c && typeof c === "object")
      .map((c: any) => ({
        name: typeof c.name === "string" ? c.name : "",
        issuer: typeof c.issuer === "string" ? c.issuer : null,
        year: typeof c.year === "string" ? c.year : null,
      }))
      .filter((c) => c.name.length > 0);
  };

  return {
    technical_skills: asStringArray(raw.technical_skills),
    frameworks: asStringArray(raw.frameworks),
    tools: asStringArray(raw.tools),
    soft_skills: asStringArray(raw.soft_skills),
    projects: asProjectArray(raw.projects),
    certifications: asCertArray(raw.certifications),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Extract a structured skill profile from raw resume plain-text.
 *
 * @param resumeText  Plain text returned by parser.ts (parsePDF / parseDOCX)
 * @returns           ResumeSkillProfile — always returns a valid object; uses
 *                    empty arrays as fallback on any error.
 */
export async function extractSkillsFromResume(
  resumeText: string
): Promise<ResumeSkillProfile> {
  if (!resumeText || resumeText.trim().length < 20) {
    console.warn("[ResumeSkillExtractor] Resume text too short — returning empty profile.");
    return emptyProfile();
  }

  const cleaned = cleanResumeText(resumeText);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(cleaned) },
      ],
      temperature: 0,             // Fully deterministic
      max_tokens: 1200,           // Sufficient for a dense profile, keeps cost low
      response_format: { type: "json_object" },  // Enforced JSON mode
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    const parsed = JSON.parse(content) as Partial<ResumeSkillProfile>;
    return sanitizeProfile(parsed);

  } catch (err) {
    console.error("[ResumeSkillExtractor] Extraction failed:", err);
    // Always return a safe fallback — never throw to callers
    return emptyProfile();
  }
}

// ─── Convenience: extract + merge with existing student skill record ───────────

/**
 * Merge a freshly extracted ResumeSkillProfile into an existing
 * student `technical_skills` JSON column value.
 *
 * The resulting object can be stored directly back to the DB:
 *   UPDATE Students SET technical_skills = ? WHERE student_id = ?
 *
 * @param existing   Current value of Students.technical_skills (parsed JSON or null)
 * @param extracted  Result of extractSkillsFromResume()
 */
export function mergeSkillsIntoStudentRecord(
  existing: Record<string, unknown> | null,
  extracted: ResumeSkillProfile
): Record<string, unknown> {
  const base = existing ?? {};

  // De-dup union helper
  const union = (a: string[], b: string[]): string[] =>
    Array.from(new Set([...a, ...b]));

  const existingTech = Array.isArray(base.technical_skills)
    ? (base.technical_skills as string[])
    : [];
  const existingFrameworks = Array.isArray(base.frameworks)
    ? (base.frameworks as string[])
    : [];
  const existingTools = Array.isArray(base.tools) ? (base.tools as string[]) : [];
  const existingSoft = Array.isArray(base.soft_skills)
    ? (base.soft_skills as string[])
    : [];

  return {
    ...base,
    technical_skills: union(existingTech, extracted.technical_skills),
    frameworks: union(existingFrameworks, extracted.frameworks),
    tools: union(existingTools, extracted.tools),
    soft_skills: union(existingSoft, extracted.soft_skills),
    resume_projects: extracted.projects,
    resume_certifications: extracted.certifications,
    resume_analyzed_at: new Date().toISOString(),
  };
}
