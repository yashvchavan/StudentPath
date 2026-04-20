/**
 * lib/jobs/jobMatcher.ts
 *
 * Pure skill-set intersection matching — no GPT, no ML.
 * Compares a user's skills against a job's required skills.
 */

export interface MatchResult {
  score: number;          // 0–100
  matched: string[];      // skills user has
  missing: string[];      // skills user lacks
  color: 'green' | 'yellow' | 'red';
  label: string;
}

/**
 * Normalise a skill string for comparison (lowercase, remove spaces/dots).
 */
function norm(skill: string): string {
  return skill.toLowerCase().replace(/[\s.\-_]/g, '');
}

/**
 * Compute match between user skills and job required skills.
 * @param userSkills   - Array of skill names the user has (from merged_skills or profile)
 * @param jobSkills    - Array of skill names the job requires
 */
export function computeMatch(userSkills: string[], jobSkills: string[]): MatchResult {
  if (!jobSkills || jobSkills.length === 0) {
    return { score: 100, matched: [], missing: [], color: 'green', label: 'All Skills Met' };
  }

  const userSet = new Set(userSkills.map(norm));

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jobSkills) {
    if (userSet.has(norm(skill))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = Math.round((matched.length / jobSkills.length) * 100);

  let color: 'green' | 'yellow' | 'red' = 'red';
  let label = 'Low Match';
  if (score >= 70) { color = 'green'; label = 'Strong Match'; }
  else if (score >= 40) { color = 'yellow'; label = 'Partial Match'; }

  return { score, matched, missing, color, label };
}

/**
 * Quick score-only check (used for filtering/sorting job lists).
 */
export function quickMatchScore(userSkills: string[], jobSkillsJson: string | null): number {
  if (!jobSkillsJson) return 50; // Neutral when no skill data
  try {
    const jobSkills: string[] = JSON.parse(jobSkillsJson);
    return computeMatch(userSkills, jobSkills).score;
  } catch {
    return 50;
  }
}
