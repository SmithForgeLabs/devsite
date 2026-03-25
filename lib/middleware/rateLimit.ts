import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  },
  5 * 60 * 1000
);

export interface RateLimitOptions {
  limit: number;
  windowSec: number;
}

export function checkRateLimit(
  req: NextRequest,
  identifier: string,
  { limit, windowSec }: RateLimitOptions
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${ip}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Troppe richieste. Riprova tra poco." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

export const rateLimits = {
  auth: { limit: 10, windowSec: 900 } satisfies RateLimitOptions,
  api: { limit: 100, windowSec: 60 } satisfies RateLimitOptions,
  upload: { limit: 20, windowSec: 60 } satisfies RateLimitOptions,
};
