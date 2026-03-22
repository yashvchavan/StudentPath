/**
 * GitHub Analyzer — lib/integrations/githubAnalyzer.ts
 *
 * Fetches public repos + README content for a GitHub user and passes
 * it to OpenAI to produce a structured skill / framework / tools profile.
 *
 * Rate-limit protection:
 *  - Uses GITHUB_TOKEN env var for authenticated requests (5 000 req / hr vs 60 unauth).
 *  - Checks the X-RateLimit-Remaining header before every fetch and throws a descriptive
 *    error when fewer than 5 requests remain.
 *  - README fetches are capped at REPO_LIMIT most-active repos to stay within budget.
 */

import OpenAI from "openai";

// ─── Config ──────────────────────────────────────────────────────────────────

const REPO_LIMIT = 10;          // Max repos to fetch README content for
const GITHUB_API = "https://api.github.com";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
}

export interface GitHubProfile {
  repos: GitHubRepo[];
  readmeSnippets: string[];         // Truncated README content per repo
}

export interface SkillProfile {
  skills: string[];
  frameworks: string[];
  tools: string[];
}

export interface GitHubAnalysisResult {
  username: string;
  reposAnalyzed: number;
  skillProfile: SkillProfile;
  rawRepos: GitHubRepo[];
  analyzedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build GitHub API request headers.
 * Uses GITHUB_TOKEN if set for higher rate limits (5 000 req/hr vs 60 unauth).
 */
function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "StudentPath-App",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Perform a rate-limited GitHub fetch.
 * Reads X-RateLimit-Remaining and throws before we hit 0.
 */
async function githubFetch(url: string): Promise<Response> {
  const res = await fetch(url, { headers: githubHeaders() });

  const remaining = parseInt(res.headers.get("X-RateLimit-Remaining") ?? "999", 10);
  const resetTs = parseInt(res.headers.get("X-RateLimit-Reset") ?? "0", 10);

  if (remaining < 5) {
    const resetDate = new Date(resetTs * 1000).toISOString();
    throw new RateLimitError(
      `GitHub API rate limit almost exhausted (${remaining} left). Resets at ${resetDate}.`
    );
  }

  if (res.status === 403 || res.status === 429) {
    const resetDate = new Date(resetTs * 1000).toISOString();
    throw new RateLimitError(
      `GitHub API rate limited (HTTP ${res.status}). Resets at ${resetDate}.`
    );
  }

  if (res.status === 404) {
    throw new NotFoundError(`GitHub resource not found: ${url}`);
  }

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${res.statusText} (${url})`);
  }

  return res;
}

// ─── Custom errors ─────────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// ─── Step 1 — Fetch repositories ─────────────────────────────────────────────

/**
 * Fetch up to 100 public repos for `username`, sorted by recent push.
 * Returns a cleaned GitHubRepo array sorted by stars + forks (most active first).
 */
export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`;
  const res = await githubFetch(url);
  const raw: any[] = await res.json();

  const repos: GitHubRepo[] = raw.map((r) => ({
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    language: (r.language as string | null) ?? null,
    topics: Array.isArray(r.topics) ? (r.topics as string[]) : [],
    stars: (r.stargazers_count as number) ?? 0,
    forks: (r.forks_count as number) ?? 0,
  }));

  // Sort by combined activity signal and cap to avoid token overflow
  return repos
    .sort((a, b) => b.stars + b.forks - (a.stars + a.forks))
    .slice(0, 50); // Keep top 50 before README limiting
}

// ─── Step 2 — Fetch README ───────────────────────────────────────────────────

/**
 * Fetch decoded README text for a single repo.
 * Returns an empty string if the repo has no README or fetch fails.
 */
export async function fetchReadme(username: string, repoName: string): Promise<string> {
  try {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/readme`;
    const res = await githubFetch(url);
    const data: any = await res.json();
    if (data.content && data.encoding === "base64") {
      // Node.js Buffer decoding
      const decoded = Buffer.from(data.content, "base64").toString("utf-8");
      // Truncate to 1 500 chars to keep tokens manageable
      return decoded.slice(0, 1500);
    }
    return "";
  } catch (err) {
    if (err instanceof NotFoundError) return ""; // No README — that's fine
    if (err instanceof RateLimitError) throw err;  // Propagate rate limit
    console.warn(`[GitHubAnalyzer] README fetch failed for ${repoName}:`, err);
    return "";
  }
}

// ─── Step 3 — Build GitHub profile ───────────────────────────────────────────

/**
 * Aggregate repos and README snippets into a GitHubProfile.
 * READMEs are fetched only for the top REPO_LIMIT repos.
 */
export async function buildGitHubProfile(username: string): Promise<GitHubProfile> {
  const repos = await fetchRepos(username);

  const topRepos = repos.slice(0, REPO_LIMIT);

  // Fetch READMEs in parallel with a small concurrency limit (3 at a time)
  const readmeSnippets: string[] = [];
  for (let i = 0; i < topRepos.length; i += 3) {
    const batch = topRepos.slice(i, i + 3);
    const results = await Promise.all(
      batch.map((r) => fetchReadme(username, r.name))
    );
    readmeSnippets.push(...results);
  }

  return { repos, readmeSnippets };
}

// ─── Step 4 — OpenAI extraction ──────────────────────────────────────────────

/**
 * Send repo metadata + README snippets to OpenAI and parse the structured
 * skill profile response.
 */
async function extractSkillsWithAI(profile: GitHubProfile): Promise<SkillProfile> {
  const topRepos = profile.repos.slice(0, REPO_LIMIT);

  // Build a compact text summary for the prompt
  const repoSummary = topRepos
    .map((r, i) => {
      const parts: string[] = [`[Repo ${i + 1}] ${r.name}`];
      if (r.language) parts.push(`Language: ${r.language}`);
      if (r.description) parts.push(`Description: ${r.description}`);
      if (r.topics.length) parts.push(`Topics: ${r.topics.join(", ")}`);
      parts.push(`Stars: ${r.stars}, Forks: ${r.forks}`);
      if (profile.readmeSnippets[i]) {
        parts.push(`README snippet:\n${profile.readmeSnippets[i]}`);
      }
      return parts.join("\n");
    })
    .join("\n\n---\n\n");

  const prompt = `You are a senior software engineer. Analyze the following GitHub repository data for a student developer and extract a comprehensive skill profile.

Repository data:
${repoSummary}

Extract exactly three categories:
1. **skills** – core programming languages and paradigms (e.g., Python, TypeScript, REST APIs, SQL).
2. **frameworks** – frameworks and libraries (e.g., React, Next.js, FastAPI, Tailwind CSS).
3. **tools** – dev tools and platforms (e.g., Docker, Git, AWS, GitHub Actions, CI/CD).

Rules:
- Infer skills from repo language, description, topics, and README content.
- Omit technologies you are not confident about.
- Do NOT include soft skills.
- Deduplicate — each item must appear at most once across all three arrays.
- Return ONLY a valid JSON object, no markdown, no explanation:

{
  "skills": ["TypeScript", "Python"],
  "frameworks": ["Next.js", "FastAPI"],
  "tools": ["Docker", "GitHub Actions"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a technical skills extraction assistant. Return ONLY valid JSON — no markdown fences, no explanation.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 600,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "{}";

  // Strip accidental markdown code fences
  const json = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(json) as Partial<SkillProfile>;
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
    };
  } catch {
    console.error("[GitHubAnalyzer] Failed to parse OpenAI response:", json);
    return { skills: [], frameworks: [], tools: [] };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Full pipeline: fetch repos → fetch READMEs → extract skills with AI.
 *
 * @param username  GitHub username (from students.github_username)
 * @returns         GitHubAnalysisResult with skill profile and raw repo data
 */
export async function analyzeGitHubProfile(
  username: string
): Promise<GitHubAnalysisResult> {
  if (!username || typeof username !== "string") {
    throw new Error("GitHub username must be a non-empty string.");
  }

  const cleanUsername = username.trim().replace(/^@/, "");

  const profile = await buildGitHubProfile(cleanUsername);
  const skillProfile = await extractSkillsWithAI(profile);

  return {
    username: cleanUsername,
    reposAnalyzed: Math.min(profile.repos.length, REPO_LIMIT),
    skillProfile,
    rawRepos: profile.repos.slice(0, REPO_LIMIT),
    analyzedAt: new Date().toISOString(),
  };
}
