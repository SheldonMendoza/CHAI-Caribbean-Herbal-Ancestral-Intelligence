/**
 * CHAI — in-memory per-IP rate limiter.
 *
 * Phase 1 policy (contracts/api.md): 60 requests/minute per client IP across
 * /api/*. On exceed -> 429 with a Retry-After header.
 *
 * This is a single-instance in-memory limiter: each Worker isolate tracks its
 * own counters. Good enough for Phase 1 traffic on the free tier.
 */

const WINDOW_MS = 60_000;
const LIMIT = 60;

const hits = new Map<string, number[]>();

export interface RateLimitDecision {
  allowed: boolean;
  /** Seconds the client should wait before retrying (only when !allowed). */
  retryAfterSec: number;
}

export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitDecision {
  const cutoff = now - WINDOW_MS;
  let recent = (hits.get(ip) ?? []).filter((t) => t > cutoff);
  if (recent.length >= LIMIT) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((recent[0]! + WINDOW_MS - now) / 1000),
    );
    hits.set(ip, recent);
    return { allowed: false, retryAfterSec };
  }
  recent = [...recent, now];
  hits.set(ip, recent);
  return { allowed: true, retryAfterSec: 0 };
}

/** Test hook: clears all counters. */
export function reset(): void {
  hits.clear();
}

/** Best-effort client IP for rate limiting. */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}
