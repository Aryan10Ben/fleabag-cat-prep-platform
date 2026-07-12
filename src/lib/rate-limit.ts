type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

export type RateLimitConfig = {
  /** Unique namespace, e.g. "auth" or "submit" */
  id: string;
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Simple in-memory rate limiter. Suitable for single-instance dev/small deploys.
 * WARNING / TODO: This is NOT safe for multi-instance production (e.g. serverless Vercel).
 * For production, configure Upstash Redis using the HTTP client (@upstash/redis)
 * and update this function to use redis.incr/expire or @upstash/ratelimit.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${config.id}:${key}`;
  const entry = store.get(bucketKey);

  if (!entry || now >= entry.resetAt) {
    store.set(bucketKey, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (entry.count >= config.limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export const RATE_LIMITS = {
  auth: { id: "auth", limit: 10, windowMs: 60_000 },
  submit: { id: "submit", limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;
