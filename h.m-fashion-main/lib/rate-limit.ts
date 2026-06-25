import { NextRequest } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __mhfRateLimit: Map<string, Bucket> | undefined;
}

const memoryStore: Map<string, Bucket> = global.__mhfRateLimit ?? new Map();
if (!global.__mhfRateLimit) global.__mhfRateLimit = memoryStore;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

async function upstashFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!base || !token) return null;
  try {
    return await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    return null;
  }
}

/** Distributed rate limit via Upstash Redis REST (optional). */
async function upstashRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult | null> {
  const redisKey = `mhf:rl:${key}`;
  const enc = encodeURIComponent(redisKey);

  const incrRes = await upstashFetch(`/incr/${enc}`);
  if (!incrRes?.ok) return null;
  const count = Number(await incrRes.text());
  if (!Number.isFinite(count)) return null;

  if (count === 1) {
    await upstashFetch(`/expire/${enc}/${windowSec}`);
  }

  if (count > limit) {
    const ttlRes = await upstashFetch(`/ttl/${enc}`);
    const ttl = ttlRes?.ok ? Number(await ttlRes.text()) : windowSec;
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, ttl) };
  }

  return { ok: true, remaining: Math.max(0, limit - count), retryAfterSec: 0 };
}

/**
 * Rate limiter: Upstash when UPSTASH_REDIS_REST_* is set, else in-memory per instance.
 */
export async function checkRateLimit(
  req: NextRequest,
  routeKey: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const key = `${routeKey}:${clientIp(req)}`;
  const windowSec = Math.ceil(windowMs / 1000);
  const distributed = await upstashRateLimit(key, limit, windowSec);
  if (distributed) return distributed;
  return memoryRateLimit(key, limit, windowMs);
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}
