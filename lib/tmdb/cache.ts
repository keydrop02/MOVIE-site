/**
 * Minimal in-memory TTL cache for TMDB responses.
 * Different endpoints use different lifetimes; user-specific data is
 * never cached here (this cache holds only public TMDB discovery data).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_MAX = 1000;

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs: number,
  maxEntries = DEFAULT_MAX
): void {
  if (store.size >= maxEntries) {
    const oldest = store.keys().next().value as string | undefined;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheClear(): void {
  store.clear();
}

/** Predefined lifetimes (ms). */
export const CACHE_TTL = {
  trending: 10 * 60 * 1000, // 10 min (short)
  popular: 30 * 60 * 1000, // 30 min (medium)
  topRated: 60 * 60 * 1000, // 1 hour (longer)
  detail: 30 * 60 * 1000, // 30 min (medium)
  genresProviders: 24 * 60 * 60 * 1000, // 24h (long)
  listing: 15 * 60 * 1000, // 15 min
} as const;
