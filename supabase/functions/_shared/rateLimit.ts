// Simple in-memory rate limiter (replace with Redis/Upstash in production)
interface Bucket {
  remaining: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, {
      remaining: maxRequests - 1,
      resetAt: now + windowSeconds * 1000
    });
    return true;
  }

  if (bucket.remaining <= 0) {
    return false;
  }

  bucket.remaining -= 1;
  return true;
}

export function getRateLimitKey(identifier: string, operation: string): string {
  return `${operation}:${identifier}`;
}
