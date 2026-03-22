/**
 * Course Recommendation Engine — lib/recommendations/courseEngine.ts
 *
 * For each missing skill:
 *  1. Check the DB cache (course_recommendations_cache) — if fresh, return it.
 *  2. On cache miss / expiry  → call YouTube Data API v3 search endpoint.
 *  3. Enrich results with precise video duration (second API call to /videos).
 *  4. Write back to cache.
 *
 * YouTube API v3 required env var:
 *   YOUTUBE_API_KEY=AIza...
 *
 * Cache TTL: 7 days (configurable via COURSE_CACHE_TTL_DAYS).
 *
 * Output shape per skill:
 *   {
 *     skill: "Next.js",
 *     fromCache: true,
 *     courses: [
 *       { title, channel, url, duration, thumbnail, viewCount }
 *     ]
 *   }
 */

import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// ─── Config ───────────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY   = process.env.YOUTUBE_API_KEY ?? "";
const YOUTUBE_SEARCH    = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS    = "https://www.googleapis.com/youtube/v3/videos";

/** Results per skill search (YouTube's max 50; we limit to 3 for quality) */
const MAX_RESULTS       = 3;

/** Cache TTL in days — refresh when older than this */
const CACHE_TTL_DAYS    = Number(process.env.COURSE_CACHE_TTL_DAYS ?? 7);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourseResult {
  title:      string;
  channel:    string;
  url:        string;
  duration:   string;   // ISO 8601 → human-readable, e.g. "3h 24m"
  thumbnail:  string;
  viewCount:  string;   // human-readable, e.g. "1.2M views"
}

export interface SkillCourseRecommendation {
  skill:     string;
  fromCache: boolean;
  courses:   CourseResult[];
  fetchedAt: string;
}

export interface CourseRecommendationResult {
  skills:      SkillCourseRecommendation[];
  totalCourses: number;
  generatedAt:  string;
}

// ─── Custom errors ────────────────────────────────────────────────────────────

export class YouTubeAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeAPIError";
  }
}

// ─── Duration helpers ─────────────────────────────────────────────────────────

/**
 * Convert ISO 8601 duration (PT3H24M15S) → human readable "3h 24m".
 */
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "Unknown";

  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const s = parseInt(match[3] ?? "0", 10);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && m === 0) parts.push(`${s}s`);   // very short video edge case
  return parts.join(" ") || "Unknown";
}

/**
 * Format raw view count to human readable: 1234567 → "1.2M views".
 */
function formatViewCount(raw: string | number): string {
  const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
  if (isNaN(n)) return "0 views";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

// ─── YouTube API calls ────────────────────────────────────────────────────────

/**
 * Step 1 — Search YouTube for videos matching "{skill} full course tutorial".
 * Returns up to MAX_RESULTS video IDs + basic snippet data.
 */
async function searchYouTube(skill: string): Promise<
  Array<{ videoId: string; title: string; channel: string; thumbnail: string }>
> {
  if (!YOUTUBE_API_KEY) {
    throw new YouTubeAPIError(
      "YOUTUBE_API_KEY is not set. Add it to your .env file."
    );
  }

  const query  = encodeURIComponent(`${skill} full course tutorial`);
  const url    =
    `${YOUTUBE_SEARCH}?key=${YOUTUBE_API_KEY}` +
    `&q=${query}` +
    `&type=video` +
    `&videoDuration=long` +          // Only long videos (> 20 min)
    `&order=relevance` +
    `&part=snippet` +
    `&maxResults=${MAX_RESULTS}` +
    `&relevanceLanguage=en` +
    `&safeSearch=strict`;

  const res = await fetch(url);

  if (res.status === 403) {
    throw new YouTubeAPIError("YouTube API quota exceeded or API key invalid.");
  }
  if (!res.ok) {
    throw new YouTubeAPIError(
      `YouTube search failed: ${res.status} ${res.statusText}`
    );
  }

  const data: any = await res.json();
  const items: any[] = data.items ?? [];

  return items.map((item: any) => ({
    videoId:   item.id?.videoId ?? "",
    title:     item.snippet?.title ?? "",
    channel:   item.snippet?.channelTitle ?? "",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.default?.url ??
      "",
  }));
}

/**
 * Step 2 — Fetch precise duration + view count for a batch of video IDs.
 * Uses the /videos endpoint (contentDetails + statistics parts).
 */
async function fetchVideoDetails(
  videoIds: string[]
): Promise<
  Map<string, { duration: string; viewCount: string }>
> {
  if (!videoIds.length) return new Map();

  const ids = videoIds.join(",");
  const url =
    `${YOUTUBE_VIDEOS}?key=${YOUTUBE_API_KEY}` +
    `&id=${ids}` +
    `&part=contentDetails,statistics`;

  const res  = await fetch(url);
  const data: any = res.ok ? await res.json() : { items: [] };
  const map  = new Map<string, { duration: string; viewCount: string }>();

  for (const item of data.items ?? []) {
    map.set(item.id, {
      duration:  parseDuration(item.contentDetails?.duration ?? ""),
      viewCount: formatViewCount(item.statistics?.viewCount ?? "0"),
    });
  }

  return map;
}

/**
 * Perform the full YouTube search + enrich pipeline for one skill.
 */
async function fetchCoursesFromYouTube(skill: string): Promise<CourseResult[]> {
  const searchResults = await searchYouTube(skill);

  if (!searchResults.length) return [];

  const videoIds     = searchResults.map((v) => v.videoId).filter(Boolean);
  const detailMap    = await fetchVideoDetails(videoIds);

  return searchResults
    .filter((v) => v.videoId)
    .map((v) => {
      const details = detailMap.get(v.videoId);
      return {
        title:     v.title,
        channel:   v.channel,
        url:       `https://www.youtube.com/watch?v=${v.videoId}`,
        duration:  details?.duration  ?? "Unknown",
        thumbnail: v.thumbnail,
        viewCount: details?.viewCount ?? "0 views",
      };
    });
}

// ─── DB cache layer ───────────────────────────────────────────────────────────

interface CacheRow extends RowDataPacket {
  courses_json: string;
  fetched_at:   Date;
}

/**
 * Read from cache.
 * Returns null if no entry exists or the entry is older than CACHE_TTL_DAYS.
 */
async function readCache(skill: string): Promise<CourseResult[] | null> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<CacheRow[]>(
      `SELECT courses_json, fetched_at
       FROM course_recommendations_cache
       WHERE skill_name = ?
       LIMIT 1`,
      [skill]
    );

    if (!rows.length) return null;

    const row        = rows[0];
    const fetchedAt  = new Date(row.fetched_at);
    const ageMs      = Date.now() - fetchedAt.getTime();
    const ttlMs      = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

    if (ageMs > ttlMs) return null;   // Expired — treat as cache miss

    try {
      const parsed =
        typeof row.courses_json === "string"
          ? JSON.parse(row.courses_json)
          : row.courses_json;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  } finally {
    connection.release();
  }
}

/**
 * Write (or refresh) a cache entry.
 */
async function writeCache(
  skill: string,
  courses: CourseResult[],
  createdBy?: number
): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.execute<ResultSetHeader>(
      `INSERT INTO course_recommendations_cache
         (skill_name, courses_json, fetched_at, created_by)
       VALUES (?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         courses_json = VALUES(courses_json),
         fetched_at   = NOW()`,
      [skill, JSON.stringify(courses), createdBy ?? null]
    );
  } finally {
    connection.release();
  }
}

// ─── Core engine ─────────────────────────────────────────────────────────────

/**
 * Fetch course recommendations for a single skill.
 * Cache-first: reads DB cache, falls back to YouTube API on miss/expiry.
 */
export async function getCoursesForSkill(
  skill: string,
  createdBy?: number
): Promise<SkillCourseRecommendation> {
  const normalised = skill.trim();

  // 1. Try cache
  const cached = await readCache(normalised);
  if (cached) {
    return {
      skill:     normalised,
      fromCache: true,
      courses:   cached,
      fetchedAt: new Date().toISOString(),
    };
  }

  // 2. Cache miss → YouTube
  const courses = await fetchCoursesFromYouTube(normalised);

  // 3. Write cache (don't fail the response if this errors)
  try {
    await writeCache(normalised, courses, createdBy);
  } catch (err) {
    console.warn(`[CourseEngine] Cache write failed for "${normalised}":`, err);
  }

  return {
    skill:     normalised,
    fromCache: false,
    courses,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Get course recommendations for multiple missing skills.
 * Skills are processed concurrently (3 at a time) to respect YouTube rate limits.
 *
 * @param missingSkills   Array of skill names (from skill gap analysis)
 * @param createdBy       Optional student_id for cache attribution
 * @returns               CourseRecommendationResult with per-skill course lists
 *
 * @example
 *   const result = await recommendCourses(["React", "Docker", "PostgreSQL"]);
 *   // result.skills[0] → { skill: "React", courses: [...], fromCache: false }
 */
export async function recommendCourses(
  missingSkills: string[],
  createdBy?: number
): Promise<CourseRecommendationResult> {
  if (!missingSkills.length) {
    return {
      skills:       [],
      totalCourses: 0,
      generatedAt:  new Date().toISOString(),
    };
  }

  // Deduplicate input
  const unique = Array.from(new Set(missingSkills.map((s) => s.trim()).filter(Boolean)));

  // Process in batches of 3 to avoid hammering YouTube API concurrently
  const BATCH   = 3;
  const results: SkillCourseRecommendation[] = [];

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map((skill) => getCoursesForSkill(skill, createdBy))
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      } else {
        console.error("[CourseEngine] Skill fetch failed:", outcome.reason);
      }
    }
  }

  const totalCourses = results.reduce((sum, r) => sum + r.courses.length, 0);

  return {
    skills:       results,
    totalCourses,
    generatedAt:  new Date().toISOString(),
  };
}

/**
 * Manually invalidate the cache for specific skills (or all if omitted).
 * Useful when you want to force a fresh YouTube fetch.
 */
export async function invalidateCourseCache(skills?: string[]): Promise<number> {
  const connection = await pool.getConnection();
  try {
    if (skills?.length) {
      const placeholders = skills.map(() => "?").join(", ");
      const [res] = await connection.execute<ResultSetHeader>(
        `DELETE FROM course_recommendations_cache WHERE skill_name IN (${placeholders})`,
        skills
      );
      return res.affectedRows;
    } else {
      const [res] = await connection.execute<ResultSetHeader>(
        `DELETE FROM course_recommendations_cache`
      );
      return res.affectedRows;
    }
  } finally {
    connection.release();
  }
}

/**
 * List all cached skill entries with their age and course count.
 * Useful for admin dashboards.
 */
export async function listCachedSkills(): Promise<
  Array<{ skill: string; courseCount: number; fetchedAt: string; ageHours: number }>
> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT skill_name, courses_json, fetched_at
       FROM course_recommendations_cache
       ORDER BY fetched_at DESC`
    );

    return rows.map((r: any) => {
      let courseCount = 0;
      try {
        const parsed =
          typeof r.courses_json === "string"
            ? JSON.parse(r.courses_json)
            : r.courses_json;
        courseCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch { /* ignore */ }

      const fetchedAt  = new Date(r.fetched_at);
      const ageHours   = Math.round((Date.now() - fetchedAt.getTime()) / 3_600_000);

      return {
        skill:       r.skill_name as string,
        courseCount,
        fetchedAt:   fetchedAt.toISOString(),
        ageHours,
      };
    });
  } finally {
    connection.release();
  }
}
