import "server-only";
import freekeys from "freekeys";

export interface ApiKeys {
  tmdb?: string;
  omdb?: string;
}

let cachedKeys: ApiKeys | null = null;

/**
 * Resolve provider credentials.
 *
 * Order:
 *   1. TMDB_API_KEY / OMDB_API_KEY environment variables
 *   2. The `freekeys` npm package (development fallback, server-side only)
 *
 * Results are cached in module scope so the free-key provider is never
 * hammered on every request. Keys must never leave the server.
 */
export async function getApiKeys(): Promise<ApiKeys> {
  if (cachedKeys) return cachedKeys;

  const keys: ApiKeys = {
    tmdb: process.env.TMDB_API_KEY?.trim() || undefined,
    omdb: process.env.OMDB_API_KEY?.trim() || undefined,
  };

  if (!keys.tmdb || !keys.omdb) {
    try {
      const resolved = await freekeys();
      if (!resolved?.tmdb_key && !resolved?.imdb_key) {
        console.warn("[keys] freekeys returned no usable keys");
      } else {
        if (!keys.tmdb && resolved.tmdb_key) keys.tmdb = String(resolved.tmdb_key);
        if (!keys.omdb && resolved.imdb_key) keys.omdb = String(resolved.imdb_key);
      }
    } catch (error) {
      console.warn(
        "[keys] freekeys fallback unavailable:",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Only memoize usable credentials — never poison the cache with a
  // transiently-failed resolution.
  if (keys.tmdb) cachedKeys = keys;
  return keys;
}

/** Test-only helper to clear the memoized credentials. */
export function resetApiKeysCache() {
  cachedKeys = null;
}
