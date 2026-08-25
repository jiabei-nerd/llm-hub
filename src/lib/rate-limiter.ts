interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const LIMITS = {
  user: { maxRequests: 60, windowMs: 60_000 },
  admin: { maxRequests: 300, windowMs: 60_000 },
};

export function checkRateLimit(userId: string, role: string): { allowed: boolean; retryAfterMs?: number } {
  const config = role === 'admin' ? LIMITS.admin : LIMITS.user;
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now - entry.windowStart > config.windowMs) {
    store.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, retryAfterMs: config.windowMs - (now - entry.windowStart) };
  }

  entry.count++;
  return { allowed: true };
}
