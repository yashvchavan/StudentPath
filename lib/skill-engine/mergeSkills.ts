/**
 * Skill Merge Engine — lib/skill-engine/mergeSkills.ts
 *
 * Combines skill data from three sources (GitHub, LeetCode, Resume) into a
 * unified, deduplicated, confidence-scored skill list.
 *
 * Confidence rules (per spec):
 *  GitHub only    → 0.80
 *  LeetCode only  → 0.90
 *  Resume only    → 0.60
 *  2 sources      → 0.95
 *  3 sources      → 0.95
 *
 * Proficiency mapping:
 *  Resume explicitly rates skills 0-5, which we scale to 0-10.
 *  GitHub repos / LeetCode tags imply proficiency via a heuristic signal.
 *  Multi-source skills get a small proficiency bonus.
 */

import type { SkillProfile as GitHubSkillProfile } from "@/lib/integrations/githubAnalyzer";
import type { DSASkillProfile }                    from "@/lib/integrations/leetcodeAnalyzer";
import type { ResumeSkillProfile }                 from "@/lib/resume/skillExtractor";

// ─── Source identifiers ───────────────────────────────────────────────────────

export type SkillSource = "github" | "leetcode" | "resume";

// ─── Confidence table ─────────────────────────────────────────────────────────

const BASE_CONFIDENCE: Record<SkillSource, number> = {
  github:   0.80,
  leetcode: 0.90,
  resume:   0.60,
};

const MULTI_SOURCE_CONFIDENCE = 0.95;

// ─── Proficiency defaults per source ─────────────────────────────────────────

/** Default proficiency (0-10) granted to a skill when we have no numeric signal. */
const DEFAULT_PROFICIENCY: Record<SkillSource, number> = {
  github:   6,   // Being able to use a language/tool in a real project = decent
  leetcode: 7,   // Solving tagged problems shows applied knowledge
  resume:   5,   // Self-reported; we trust it less
};

/** Bonus added to proficiency when a skill appears in 2+ sources. */
const MULTI_SOURCE_BONUS = 1;

// ─── Input contract ───────────────────────────────────────────────────────────

/**
 * Caller must flatten their sub-sources before passing in.
 * Convenience adapters at the bottom of this file do it automatically from
 * the raw analyser results.
 */
export interface SourceSkillMap {
  /** All skill/language/tool/framework strings from GitHub analysis */
  github?: string[];
  /** All topic strings from LeetCode tag analysis (e.g. "Arrays", "Graphs") */
  leetcode?: string[];
  /**
   * All skill strings from resume extraction.
   * May include a numeric proficiency hint: { name: string; level: number }
   * OR plain strings.  Both forms are accepted.
   */
  resume?: ResumeSkillInput[];
}

export type ResumeSkillInput =
  | string
  | { name: string; level?: number };   // level is 0-5 (from the extractor's Slider values)

// ─── Output types ─────────────────────────────────────────────────────────────

export interface MergedSkill {
  /** Canonical skill name (title-cased) */
  skill: string;
  /** 0–10 proficiency score */
  proficiency: number;
  /** 0–1 confidence in the proficiency data */
  confidence: number;
  /** Every source that reported this skill */
  sources: SkillSource[];
}

export interface MergeResult {
  skills: MergedSkill[];
  /** Summary counts */
  totalSkills: number;
  sourceCoverage: Record<SkillSource, number>;
  mergedAt: string;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Canonical key for a skill name.
 * Lowercased, stripped of punctuation, spaces collapsed.
 * Used only for deduplication — the display name is preserved separately.
 */
function canonicalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.\-_+#]/g, " ")     // treat . - _ + # as spaces (e.g. c++ → c  )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Return the "prettier" of two skill name strings.
 * Prefers title-cased, shorter, or the first one seen.
 */
function betterName(a: string, b: string): string {
  // Prefer the one with more uppercase letters (usually more canonical)
  const scoreA = (a.match(/[A-Z]/g) || []).length;
  const scoreB = (b.match(/[A-Z]/g) || []).length;
  if (scoreB > scoreA) return b;
  if (scoreA > scoreB) return a;
  // Tie-break: shorter name
  return a.length <= b.length ? a : b;
}

// ─── Internal accumulator ─────────────────────────────────────────────────────

interface Accumulator {
  displayName: string;
  sources: Set<SkillSource>;
  /** Sum of all proficiency hints received (before averaging) */
  proficiencySum: number;
  proficiencyCount: number;
}

// ─── Core merge logic ─────────────────────────────────────────────────────────

/**
 * Ingest one batch of skill strings from a given source into the accumulator map.
 */
function ingestSource(
  map: Map<string, Accumulator>,
  source: SkillSource,
  skills: string[],
  defaultProficiency: number
): void {
  for (const raw of skills) {
    if (!raw || typeof raw !== "string") continue;
    const name = raw.trim();
    if (!name) continue;

    const key = canonicalize(name);
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.displayName = betterName(existing.displayName, name);
      existing.sources.add(source);
      existing.proficiencySum += defaultProficiency;
      existing.proficiencyCount += 1;
    } else {
      map.set(key, {
        displayName: name,
        sources: new Set([source]),
        proficiencySum: defaultProficiency,
        proficiencyCount: 1,
      });
    }
  }
}

/**
 * Ingest resume skills, optionally with their numeric proficiency level (0-5).
 * Scales 0-5 → 0-10.
 */
function ingestResume(
  map: Map<string, Accumulator>,
  skills: ResumeSkillInput[]
): void {
  for (const raw of skills) {
    let name: string;
    let levelRaw: number = DEFAULT_PROFICIENCY.resume; // default 0-10 value

    if (typeof raw === "string") {
      name = raw.trim();
    } else {
      name = raw.name.trim();
      // raw.level is 0-5 from the Slider; scale to 0-10
      if (typeof raw.level === "number" && raw.level >= 0) {
        levelRaw = Math.min(10, raw.level * 2);
      }
    }

    if (!name) continue;
    const key = canonicalize(name);
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.displayName = betterName(existing.displayName, name);
      existing.sources.add("resume");
      existing.proficiencySum += levelRaw;
      existing.proficiencyCount += 1;
    } else {
      map.set(key, {
        displayName: name,
        sources: new Set(["resume"]),
        proficiencySum: levelRaw,
        proficiencyCount: 1,
      });
    }
  }
}

/**
 * Compute confidence score from the set of sources.
 */
function computeConfidence(sources: Set<SkillSource>): number {
  if (sources.size >= 2) return MULTI_SOURCE_CONFIDENCE;
  const [only] = sources;
  return BASE_CONFIDENCE[only] ?? 0.5;
}

/**
 * Compute final proficiency (0-10, integer) for a skill accumulator.
 * Multi-source skills get a +MULTI_SOURCE_BONUS boost.
 */
function computeProficiency(acc: Accumulator): number {
  const avg = acc.proficiencySum / acc.proficiencyCount;
  const bonus = acc.sources.size >= 2 ? MULTI_SOURCE_BONUS : 0;
  return Math.min(10, Math.round(avg + bonus));
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Merge skill arrays from GitHub, LeetCode and Resume into a single deduplicated,
 * confidence-scored list.
 *
 * @param input  SourceSkillMap — any combination of the three sources (all optional)
 * @returns      MergeResult with the merged skill array and summary stats
 */
export function mergeSkills(input: SourceSkillMap): MergeResult {
  const map = new Map<string, Accumulator>();

  // Ingest GitHub — flat string arrays (skills + frameworks + tools all go in)
  if (Array.isArray(input.github)) {
    ingestSource(map, "github", input.github, DEFAULT_PROFICIENCY.github);
  }

  // Ingest LeetCode — topic strings like "Arrays", "Dynamic Programming"
  if (Array.isArray(input.leetcode)) {
    ingestSource(map, "leetcode", input.leetcode, DEFAULT_PROFICIENCY.leetcode);
  }

  // Ingest Resume — string or {name, level} items
  if (Array.isArray(input.resume)) {
    ingestResume(map, input.resume);
  }

  // Build final skill list
  const skills: MergedSkill[] = Array.from(map.values()).map((acc) => ({
    skill: acc.displayName,
    proficiency: computeProficiency(acc),
    confidence: parseFloat(computeConfidence(acc.sources).toFixed(2)),
    sources: Array.from(acc.sources).sort() as SkillSource[],
  }));

  // Sort: multi-source first, then by proficiency desc, then alpha
  skills.sort((a, b) => {
    if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length;
    if (b.proficiency !== a.proficiency) return b.proficiency - a.proficiency;
    return a.skill.localeCompare(b.skill);
  });

  // Coverage stats
  const sourceCoverage: Record<SkillSource, number> = {
    github: 0,
    leetcode: 0,
    resume: 0,
  };
  for (const s of skills) {
    for (const src of s.sources) sourceCoverage[src] += 1;
  }

  return {
    skills,
    totalSkills: skills.length,
    sourceCoverage,
    mergedAt: new Date().toISOString(),
  };
}

// ─── Convenience adapters ─────────────────────────────────────────────────────
// These convert the raw analyser output types directly into SourceSkillMap entries.

/**
 * Flatten a GitHubAnalysisResult.skillProfile into a single string[].
 *
 * Usage:
 *   const githubSkills = flattenGitHubSkills(githubResult.skillProfile);
 */
export function flattenGitHubSkills(profile: GitHubSkillProfile): string[] {
  return [...profile.skills, ...profile.frameworks, ...profile.tools];
}

/**
 * Flatten a DSASkillProfile into a string[] of topic names.
 * Also injects a synthetic "DSA" or "Algorithms" entry based on skill level.
 *
 * Usage:
 *   const leetcodeSkills = flattenLeetCodeSkills(leetcodeResult.dsaProfile);
 */
export function flattenLeetCodeSkills(profile: DSASkillProfile): string[] {
  const topics = [...profile.topics];

  // Add canonical DSA entries so they appear in the merged list
  topics.unshift("Data Structures and Algorithms");
  if (profile.level === "advanced") topics.unshift("Competitive Programming");

  return topics;
}

/**
 * Flatten a ResumeSkillProfile into ResumeSkillInput[].
 * Technical skills, frameworks, tools, and soft skills are all included
 * so they can be merged into the unified Skill Passport.
 *
 * Usage:
 *   const resumeSkills = flattenResumeSkills(resumeResult);
 */
export function flattenResumeSkills(profile: ResumeSkillProfile): ResumeSkillInput[] {
  return [
    ...profile.technical_skills,
    ...profile.frameworks,
    ...profile.tools,
    ...profile.soft_skills,
  ];
}

// ─── All-in-one convenience wrapper ──────────────────────────────────────────

/**
 * One-call helper: takes the raw analyser results and runs the full pipeline.
 *
 * @param githubResult   Result from analyzeGitHubProfile()   — optional
 * @param leetcodeResult Result from analyzeLeetCodeProfile()  — optional
 * @param resumeResult   Result from extractSkillsFromResume() — optional
 */
export function mergeAllSources(
  githubResult?: GitHubSkillProfile | null,
  leetcodeResult?: DSASkillProfile | null,
  resumeResult?: ResumeSkillProfile | null,
): MergeResult {
  return mergeSkills({
    github:   githubResult   ? flattenGitHubSkills(githubResult)     : undefined,
    leetcode: leetcodeResult ? flattenLeetCodeSkills(leetcodeResult)  : undefined,
    resume:   resumeResult   ? flattenResumeSkills(resumeResult)      : undefined,
  });
}
