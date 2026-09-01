import { TMDB_IMAGE_BASE } from "./config";

export type ImageKind = "poster" | "backdrop" | "profile" | "logo" | "still";

const defaultSize: Record<ImageKind, string> = {
  poster: "w500",
  backdrop: "w1280",
  profile: "w185",
  logo: "w300",
  still: "w300",
};

const posterFallbackSizes = ["w500", "w342", "w185"] as const;
const backdropFallbackSizes = ["w1280", "w780"] as const;

/**
 * Build a full TMDB image URL from a path, choosing an appropriate
 * size. Returns null for null/empty/invalid paths so callers can
 * render a fallback instead of a broken image.
 */
export function getTmdbImage(
  path: string | null | undefined,
  kind: ImageKind = "poster",
  size?: string
): string | null {
  if (!path || typeof path !== "string" || !path.startsWith("/")) return null;
  const chosen = size ?? defaultSize[kind];
  return `${TMDB_IMAGE_BASE}/${chosen}${path}`;
}

/**
 * Returns a list of candidate URLs for an image, from largest to
 * smallest, so a component can fall back if a size 404s.
 */
export function getTmdbImageFallbacks(
  path: string | null | undefined,
  kind: ImageKind
): string[] {
  if (!path || !path.startsWith("/")) return [];
  const sizes =
    kind === "poster"
      ? posterFallbackSizes
      : kind === "backdrop"
        ? backdropFallbackSizes
        : [defaultSize[kind]];
  return sizes.map((s) => `${TMDB_IMAGE_BASE}/${s}${path}`);
}

/** Posters for grid cards (common sizing). */
export function posterUrl(path: string | null | undefined): string | null {
  return getTmdbImage(path, "poster", "w500");
}

/** Backdrops for heroes. */
export function backdropUrl(path: string | null | undefined): string | null {
  return getTmdbImage(path, "backdrop", "w1280");
}
