type Window = { count: number; resetAt: number };
const store = new Map<string, Window>();

// Prune expired entries once per minute to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 60_000).unref();

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * Key should encode both the action and the caller (e.g. `login:1.2.3.4`).
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
