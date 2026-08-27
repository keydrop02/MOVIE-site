const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageKind = "poster" | "backdrop" | "profile" | "still" | "logo";

type SizeMap = Record<ImageKind, string>;

const SIZES: Record<"sm" | "md" | "lg" | "original", SizeMap> = {
  sm: {
    poster: "w185",
    backdrop: "w300",
    profile: "w92",
    still: "w185",
    logo: "w154",
  },
  md: {
    poster: "w342",
    backdrop: "w780",
    profile: "w185",
    still: "w300",
    logo: "w300",
  },
  lg: {
    poster: "w780",
    backdrop: "w1280",
    profile: "h632",
    still: "w780",
    logo: "w500",
  },
  original: {
    poster: "original",
    backdrop: "original",
    profile: "original",
    still: "original",
    logo: "original",
  },
};

/**
 * Build a TMDB image URL. Returns null when the path is missing so callers can
 * render a placeholder instead of a broken image.
 */
export function tmdbImage(
  path: string | null | undefined,
  kind: ImageKind,
  size: keyof typeof SIZES = "md"
): string | null {
  if (!path) return null;
  const sizeKey = SIZES[size][kind];
  return `${TMDB_IMAGE_BASE}/${sizeKey}${path}`;
}

/** Absolute URL suitable for Open Graph metadata. */
export function tmdbImageAbsolute(
  path: string | null | undefined,
  kind: ImageKind,
  size: keyof typeof SIZES = "md"
): string | undefined {
  return tmdbImage(path, kind, size) ?? undefined;
}

/**
 * Resolve an image source that is either an absolute URL or a TMDB image
 * path.
 */
export function mediaImage(
  path: string | null | undefined,
  kind: ImageKind,
  size: keyof typeof SIZES = "md"
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return tmdbImage(path, kind, size);
}
