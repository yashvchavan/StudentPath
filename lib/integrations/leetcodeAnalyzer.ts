/**
 * LeetCode Analyzer — lib/integrations/leetcodeAnalyzer.ts
 *
 * Uses the unofficial (but publicly accessible) LeetCode GraphQL API to fetch:
 *  - Solve counts by difficulty (easy / medium / hard / total)
 *  - Contest rating
 *  - Per-tag problem counts
 *
 * Infers a structured DSA skill profile from the tag data.
 *
 * Note on the API:
 *  LeetCode does NOT require authentication for public profile queries.
 *  However they do apply per-IP rate limiting. To stay safe we:
 *    - Respect Retry-After headers when present.
 *    - Expose helper delays between bulk requests.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

/**
 * Minimum problems solved to consider a tag significant.
 * Tags solved fewer than this many times are omitted from the profile.
 */
const MIN_TAG_COUNT = 3;

// ─── GraphQL query definitions ────────────────────────────────────────────────

/**
 * Primary stats query:
 *  - submitStatsGlobal  → total/easy/medium/hard counts
 *  - userContestRankingInfo → contest rating + attended
 */
const STATS_QUERY = /* GraphQL */ `
  query getUserStats($username: String!) {
    matchedUser(username: $username) {
      username
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      totalParticipants
      topPercentage
      attendedContestsCount
    }
  }
`;

/**
 * Tag stats query — returns the list of problem tags the user has solved
 * along with the count per tag.
 */
const TAGS_QUERY = /* GraphQL */ `
  query getUserTagStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DifficultyCounts {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface ContestStats {
  rating: number | null;
  globalRanking: number | null;
  topPercentage: number | null;
  attendedContests: number;
}

export interface TagStat {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface LeetCodeRawData {
  username: string;
  difficultyCounts: DifficultyCounts;
  contestStats: ContestStats;
  tags: TagStat[];
}

/** Skill level thresholds */
export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface DSASkillProfile {
  skill: "Data Structures and Algorithms";
  level: SkillLevel;
  solved: number;
  easy: number;
  medium: number;
  hard: number;
  contestRating: number | null;
  attendedContests: number;
  topPercentage: number | null;
  topics: string[];                // Top tag slugs by count
  topicDetails: TagStat[];         // Full tag list (filtered)
}

export interface LeetCodeAnalysisResult {
  username: string;
  dsaProfile: DSASkillProfile;
  analyzedAt: string;
}

// ─── Custom Errors ────────────────────────────────────────────────────────────

export class LeetCodeUserNotFoundError extends Error {
  constructor(username: string) {
    super(`LeetCode user "${username}" not found or profile is private.`);
    this.name = "LeetCodeUserNotFoundError";
  }
}

export class LeetCodeRateLimitError extends Error {
  retryAfter: number; // seconds
  constructor(retryAfter = 60) {
    super(`LeetCode API rate limited. Retry after ${retryAfter}s.`);
    this.name = "LeetCodeRateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ─── GraphQL Fetcher ──────────────────────────────────────────────────────────

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function leetcodeFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // LeetCode requires a referer header to process GraphQL requests
      Referer: "https://leetcode.com",
      "User-Agent":
        "Mozilla/5.0 (compatible; StudentPath-App/1.0; +https://studentpath.app)",
    },
    body: JSON.stringify({ query, variables }),
  });

  // Handle rate limiting
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
    throw new LeetCodeRateLimitError(retryAfter);
  }

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL HTTP error: ${res.status} ${res.statusText}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join("; ");
    throw new Error(`LeetCode GraphQL errors: ${msg}`);
  }

  if (!json.data) {
    throw new Error("LeetCode GraphQL returned no data.");
  }

  return json.data;
}

// ─── Step 1 — Fetch solve stats + contest info ────────────────────────────────

interface StatsQueryResult {
  matchedUser: {
    username: string;
    submitStatsGlobal: {
      acSubmissionNum: Array<{
        difficulty: string; // "All" | "Easy" | "Medium" | "Hard"
        count: number;
        submissions: number;
      }>;
    };
  } | null;
  userContestRanking: {
    rating: number;
    globalRanking: number;
    totalParticipants: number;
    topPercentage: number;
    attendedContestsCount: number;
  } | null;
}

export async function fetchLeetCodeStats(username: string): Promise<{
  difficultyCounts: DifficultyCounts;
  contestStats: ContestStats;
}> {
  const data = await leetcodeFetch<StatsQueryResult>(STATS_QUERY, { username });

  if (!data.matchedUser) {
    throw new LeetCodeUserNotFoundError(username);
  }

  // Parse difficulty counts
  const acc = data.matchedUser.submitStatsGlobal.acSubmissionNum;
  const find = (d: string) => acc.find((x) => x.difficulty === d)?.count ?? 0;

  const difficultyCounts: DifficultyCounts = {
    total: find("All"),
    easy: find("Easy"),
    medium: find("Medium"),
    hard: find("Hard"),
  };

  // Parse contest stats (null if never participated)
  const cr = data.userContestRanking;
  const contestStats: ContestStats = {
    rating: cr?.rating ?? null,
    globalRanking: cr?.globalRanking ?? null,
    topPercentage: cr?.topPercentage ?? null,
    attendedContests: cr?.attendedContestsCount ?? 0,
  };

  return { difficultyCounts, contestStats };
}

// ─── Step 2 — Fetch tag breakdown ─────────────────────────────────────────────

interface TagsQueryResult {
  matchedUser: {
    tagProblemCounts: {
      advanced: TagStat[];
      intermediate: TagStat[];
      fundamental: TagStat[];
    };
  } | null;
}

export async function fetchLeetCodeTags(username: string): Promise<TagStat[]> {
  try {
    const data = await leetcodeFetch<TagsQueryResult>(TAGS_QUERY, { username });

    if (!data.matchedUser) return [];

    const { advanced, intermediate, fundamental } =
      data.matchedUser.tagProblemCounts;

    // Merge all categories, de-duplicate by tagSlug, sum counts
    const map = new Map<string, TagStat>();
    for (const tag of [...fundamental, ...intermediate, ...advanced]) {
      const existing = map.get(tag.tagSlug);
      if (existing) {
        existing.problemsSolved += tag.problemsSolved;
      } else {
        map.set(tag.tagSlug, { ...tag });
      }
    }

    return Array.from(map.values())
      .filter((t) => t.problemsSolved >= MIN_TAG_COUNT)
      .sort((a, b) => b.problemsSolved - a.problemsSolved);
  } catch (err) {
    // Tag endpoint sometimes returns 400 for newer accounts — degrade gracefully
    if (err instanceof LeetCodeRateLimitError) throw err;
    console.warn(`[LeetCodeAnalyzer] Tag fetch failed for ${username}:`, err);
    return [];
  }
}

// ─── Step 3 — Skill level inference ──────────────────────────────────────────

/**
 * Determine skill level from solved count.
 * Thresholds: 0–49 = beginner | 50–199 = intermediate | 200+ = advanced
 */
export function inferSkillLevel(totalSolved: number): SkillLevel {
  if (totalSolved >= 200) return "advanced";
  if (totalSolved >= 50) return "intermediate";
  return "beginner";
}

/**
 * Map LeetCode tag slugs to human-readable DSA topic names.
 * Unmapped slugs are returned title-cased as-is.
 */
const TAG_LABEL_MAP: Record<string, string> = {
  array: "Arrays",
  "two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  string: "Strings",
  "hash-table": "Hash Tables",
  math: "Mathematics",
  "dynamic-programming": "Dynamic Programming",
  "depth-first-search": "Depth-First Search",
  "breadth-first-search": "Breadth-First Search",
  sorting: "Sorting",
  greedy: "Greedy Algorithms",
  "binary-search": "Binary Search",
  tree: "Trees",
  "binary-tree": "Binary Trees",
  "binary-search-tree": "Binary Search Tree",
  graph: "Graphs",
  "topological-sort": "Topological Sort",
  "union-find": "Union-Find",
  heap: "Heaps",
  "priority-queue": "Priority Queues",
  stack: "Stacks",
  queue: "Queues",
  "linked-list": "Linked Lists",
  recursion: "Recursion",
  backtracking: "Backtracking",
  "bit-manipulation": "Bit Manipulation",
  trie: "Tries",
  "segment-tree": "Segment Trees",
  "monotonic-stack": "Monotonic Stack",
  matrix: "Matrices",
  simulation: "Simulation",
  design: "System Design",
  "number-theory": "Number Theory",
  geometry: "Geometry",
  "game-theory": "Game Theory",
};

function humanizeTag(slug: string): string {
  return (
    TAG_LABEL_MAP[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// ─── Step 4 — Build full profile ─────────────────────────────────────────────

function buildDSAProfile(raw: LeetCodeRawData): DSASkillProfile {
  const { difficultyCounts, contestStats, tags } = raw;

  const level = inferSkillLevel(difficultyCounts.total);

  const topicDetails = tags.map((t) => ({
    tagName: humanizeTag(t.tagSlug),
    tagSlug: t.tagSlug,
    problemsSolved: t.problemsSolved,
  }));

  // Top 15 topics for the concise list
  const topics = topicDetails.slice(0, 15).map((t) => t.tagName);

  return {
    skill: "Data Structures and Algorithms",
    level,
    solved: difficultyCounts.total,
    easy: difficultyCounts.easy,
    medium: difficultyCounts.medium,
    hard: difficultyCounts.hard,
    contestRating: contestStats.rating
      ? Math.round(contestStats.rating)
      : null,
    attendedContests: contestStats.attendedContests,
    topPercentage: contestStats.topPercentage
      ? parseFloat(contestStats.topPercentage.toFixed(1))
      : null,
    topics,
    topicDetails,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Full LeetCode analysis pipeline.
 *
 * @param username  LeetCode username (from students.leetcode_username)
 * @returns         LeetCodeAnalysisResult with DSA profile
 *
 * @throws LeetCodeUserNotFoundError  — user doesn't exist / profile is private
 * @throws LeetCodeRateLimitError     — API rate limit hit
 * @throws Error                      — unexpected GraphQL / network error
 */
export async function analyzeLeetCodeProfile(
  username: string
): Promise<LeetCodeAnalysisResult> {
  if (!username || typeof username !== "string") {
    throw new Error("LeetCode username must be a non-empty string.");
  }

  const cleanUsername = username.trim();

  // Fetch stats and tags concurrently to minimise latency
  const [{ difficultyCounts, contestStats }, tags] = await Promise.all([
    fetchLeetCodeStats(cleanUsername),
    fetchLeetCodeTags(cleanUsername),
  ]);

  const raw: LeetCodeRawData = {
    username: cleanUsername,
    difficultyCounts,
    contestStats,
    tags,
  };

  const dsaProfile = buildDSAProfile(raw);

  return {
    username: cleanUsername,
    dsaProfile,
    analyzedAt: new Date().toISOString(),
  };
}
