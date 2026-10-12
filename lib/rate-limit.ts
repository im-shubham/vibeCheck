// Simple fixed-window limiter. In-memory: effective per server instance. On serverless
// platforms use it as a first line of defence and back it with an edge/WAF limiter
// (e.g. Vercel Firewall or Upstash) for strict global limits.
interface Bucket {
  count: number;
  reset: number;
}
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return b.count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
}
