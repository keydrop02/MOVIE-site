/**
 * TMDB service configuration.
 * IMPORTANT: These values are server-only. This module must never be
 * imported from a Client Component (next/server guards ascriptions below).
 */
export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getTmdbToken(): string {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "TMDB_ACCESS_TOKEN environment variable is not set. Add it to .env.local"
    );
  }
  return token;
}

/** Image size tokens as offered by TMDB. */
export const IMAGE_SIZES = {
  backdrop: ["w300", "w780", "w1280", "original"] as const,
  logo: ["w45", "w92", "w154", "w185", "w300", "w500", "original"] as const,
  poster: ["w92", "w154", "w185", "w342", "w500", "w780", "original"] as const,
  profile: ["w45", "w185", "h632", "original"] as const,
  still: ["w92", "w185", "w300", "original"] as const,
} as const;
