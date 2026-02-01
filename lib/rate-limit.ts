import { NextRequest } from 'next/server';

const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

/**
 * Basic in-memory rate limiter.
 * Note: In a serverless environment, this state is not shared across lambda instances.
 * For production, use Redis (e.g., Upstash).
 * 
 * @param request NextRequest
 * @param limit Max requests per window
 * @param windowMs Time window in milliseconds (default 60s)
 * @returns true if allowed, false if limit exceeded
 */
export function checkRateLimit(request: NextRequest, limit: number = 5, windowMs: number = 60000): boolean {
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    const record = rateLimitStore.get(ip) || { count: 0, lastReset: now };

    // Reset if window passed
    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }

    record.count += 1;
    rateLimitStore.set(ip, record);

    return record.count <= limit;
}
