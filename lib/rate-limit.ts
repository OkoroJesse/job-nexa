/**
 * lib/rate-limit.ts
 *
 * Production rate limiting for sensitive payment API routes.
 * Uses @upstash/ratelimit with Upstash Redis.
 *
 * Required environment variables (server-side only, never NEXT_PUBLIC_):
 *   UPSTASH_REDIS_REST_URL   — from Upstash Console → Redis → REST API
 *   UPSTASH_REDIS_REST_TOKEN — from Upstash Console → Redis → REST API
 *
 * When Upstash credentials are not configured (local dev / placeholder),
 * all rate-limit checks pass through transparently with a warning.
 */

import { NextRequest, NextResponse } from 'next/server';

// Lazy-import to avoid crashing when credentials are missing at build time
let Ratelimit: typeof import('@upstash/ratelimit').Ratelimit | undefined;
let Redis: typeof import('@upstash/redis').Redis | undefined;

function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    !process.env.UPSTASH_REDIS_REST_URL.includes('placeholder') &&
    !process.env.UPSTASH_REDIS_REST_TOKEN.includes('placeholder')
  );
}

type LimiterName =
  | 'paystack_init'       // Paystack initialization: 10 req / 60 s per user/IP
  | 'paystack_verify'     // Paystack verify: 20 req / 60 s per user/IP (must handle redirects)
  | 'bank_transfer'       // Bank transfer submit: 5 req / 300 s per user
  | 'webhook_paystack'   // Paystack webhook: 120 req / 60 s per IP (Paystack retries aggressively)
  | 'auth_login'          // Login attempts: 10 req / 600 s (10 mins) per IP & email
  | 'auth_register'       // Registrations: 10 req / 600 s (10 mins) per IP & email
  | 'auth_forgot_password'; // Password resets: 5 req / 900 s (15 mins) per IP & email

interface LimiterConfig {
  requests: number;
  window: `${number} s` | `${number} m` | `${number} h`;
}

const LIMITER_CONFIGS: Record<LimiterName, LimiterConfig> = {
  paystack_init:        { requests: Number(process.env.RL_PAYSTACK_INIT_LIMIT || 10), window: '60 s' },
  paystack_verify:      { requests: Number(process.env.RL_PAYSTACK_VERIFY_LIMIT || 20), window: '60 s' },
  bank_transfer:        { requests: Number(process.env.RL_BANK_TRANSFER_LIMIT || 5), window: '300 s' },
  webhook_paystack:     { requests: Number(process.env.RL_WEBHOOK_LIMIT || 120), window: '60 s' },
  auth_login:           { requests: Number(process.env.RL_AUTH_LOGIN_LIMIT || 10), window: '600 s' },
  auth_register:        { requests: Number(process.env.RL_AUTH_REGISTER_LIMIT || 10), window: '600 s' },
  auth_forgot_password: { requests: Number(process.env.RL_AUTH_FORGOT_PWD_LIMIT || 5), window: '900 s' },
};

// Cache Ratelimit instances so we don't re-instantiate per request
const limiterCache = new Map<LimiterName, import('@upstash/ratelimit').Ratelimit>();

async function getLimiter(
  name: LimiterName
): Promise<import('@upstash/ratelimit').Ratelimit | null> {
  if (!isUpstashConfigured()) return null;

  if (limiterCache.has(name)) {
    return limiterCache.get(name)!;
  }

  try {
    if (!Ratelimit) {
      const rl = await import('@upstash/ratelimit');
      Ratelimit = rl.Ratelimit;
    }
    if (!Redis) {
      const redisModule = await import('@upstash/redis');
      Redis = redisModule.Redis;
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const cfg = LIMITER_CONFIGS[name];
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window),
      prefix: `jobnexa:rl:${name}`,
      analytics: false, // Set to true if you want Upstash analytics dashboard
    });

    limiterCache.set(name, limiter);
    return limiter;
  } catch (err) {
    console.warn(`[RateLimit] Failed to initialise limiter "${name}":`, err);
    return null;
  }
}

/**
 * Extract a stable identifier for rate-limiting from the request.
 * Priority: authenticated user ID from X-User-Id header → IP → 'anonymous'
 *
 * NOTE: The calling route should still verify auth independently.
 * This identifier is for rate-limiting only, not for authorisation.
 */
export function getClientIp(req: NextRequest): string {
  // Trust standard proxy headers provided by Vercel and edge infrastructure
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Extract a stable identifier for rate-limiting from the request.
 * Allows isolation by user ID, account/email, or trusted client IP.
 */
export function getRateLimitKey(req: NextRequest, identifier?: string): string {
  const ip = getClientIp(req);
  if (identifier) {
    const cleanId = identifier.trim().toLowerCase();
    return `${cleanId}#ip:${ip}`;
  }
  return `ip:${ip}`;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  retryAfterSeconds: number;
}

/**
 * Check the rate limit for a given limiter name and identifier.
 * Returns { allowed: true } transparently when Upstash is not configured.
 */
export async function checkRateLimit(
  name: LimiterName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = await getLimiter(name);

  if (!limiter) {
    // Upstash not configured — pass through (dev mode)
    return { allowed: true, limit: 999, remaining: 999, reset: 0, retryAfterSeconds: 0 };
  }

  try {
    const result = await limiter.limit(identifier);
    const retryAfterSeconds = result.reset
      ? Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))
      : 60;

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset ? Math.ceil(result.reset / 1000) : 0,
      retryAfterSeconds,
    };
  } catch (err) {
    console.warn(`[RateLimit] Error checking limit for "${name}":`, err);
    // On Redis error, fail open (allow the request) to prevent payment disruption
    return { allowed: true, limit: 999, remaining: 999, reset: 0, retryAfterSeconds: 0 };
  }
}

/**
 * Build a 429 Too Many Requests response with proper headers.
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please wait before trying again.',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}

/**
 * Convenience wrapper: check rate limit and return a response if exceeded.
 * Returns null if the request is allowed; returns a NextResponse if blocked.
 */
export async function enforceRateLimit(
  req: NextRequest,
  name: LimiterName,
  userId?: string
): Promise<NextResponse | null> {
  const key = getRateLimitKey(req, userId);
  const result = await checkRateLimit(name, key);

  if (!result.allowed) {
    console.warn(
      `[RateLimit] BLOCKED — limiter="${name}" key="${key}" ` +
        `limit=${result.limit} reset=${result.reset}`
    );
    return rateLimitExceededResponse(result);
  }

  return null;
}
