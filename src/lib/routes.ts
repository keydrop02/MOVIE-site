/**
 * The anime section is a namespace over the standard TMDB routes. Links
 * opened from `/anime/*` detail pages carry `?ns=anime` so the watch pages
 * can point their back-links at the anime details page and keep internal
 * navigation (season switches, episode clicks) inside the anime namespace.
 */
export type Namespace = "standard" | "anime";

/** Appends `ns=anime` to a URL when the anime namespace is active. */
export function withNamespace(href: string, ns: Namespace): string {
  if (ns !== "anime") return href;
  return `${href}${href.includes("?") ? "&" : "?"}ns=anime`;
}

/** Reads an `ns` search-param value into a `Namespace`. */
export function namespaceOf(value: string | string[] | undefined): Namespace {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "anime" ? "anime" : "standard";
}

/** Details-page URL for a title, honoring the active namespace. */
export function detailsHref(
  type: "tv" | "movie",
  tmdbId: number,
  ns: Namespace
): string {
  return ns === "anime" ? `/anime/${type}/${tmdbId}` : `/${type}/${tmdbId}`;
}
