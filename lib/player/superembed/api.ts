import "server-only";

// ── SuperEmbed JSON Data Hub client ─────────────────────────────────────────
//
// Official docs: https://www.superembed.stream/movie-streaming-api.html
//   GET https://seapi.link/?type={imdb|tmdb}&id={id}&season={s}&episode={e}&max_results={1-5}
//
// Response envelope (per Apiary reference) is JSON such as:
//   { "message": "OK", "status": 200, "title": "…", "results": [ … ] }
//
// Upstream intentionally does NOT expose raw .mp4/.m3u8 files — each item's
// `url` is a playback PAGE for one mirror server. Links are valid 48h.

export const SUPEREMBED_API_BASE =
  process.env.SUPEREMBED_API_BASE ?? "https://seapi.link";

export type SuperEmbedMediaType = "movie" | "tv";

export interface SuperEmbedSource {
  /** Mirrored/embed host name, e.g. "streamtape". */
  server: string;
  quality?: string;
  language?: string;
  /** Playback page URL (not a direct file). */
  url: string;
}

export interface SuperEmbedApiResult {
  /** Raw upstream JSON payload, stored verbatim in the cache. */
  rawPayload: string;
  sources: SuperEmbedSource[];
}

export interface FetchStreamsInput {
  mediaType: SuperEmbedMediaType;
  /** TMDB id when type=tmdb, IMDB id (tt…) when type=imdb. We always use tmdb. */
  id: string;
  season?: number;
  episode?: number;
  maxResults?: number;
}

function normalizeSource(item: Record<string, unknown>): SuperEmbedSource | null {
  const url = String(item?.url ?? item?.link ?? "").trim();
  if (!url) return null;
  const server = String(item?.server ?? item?.name ?? item?.host ?? "").trim();
  if (!server) return null;
  return {
    server,
    quality: item?.quality != null ? String(item.quality) : undefined,
    language: item?.language != null ? String(item.language) : undefined,
    url,
  };
}

export function parsePayload(rawPayload: string): SuperEmbedSource[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return [];
  }
  // Upstream envelope JSON: { message, status, title, results: [...] }
  let list: unknown[] = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { results?: unknown[] }).results)
  ) {
    list = (parsed as { results: unknown[] }).results;
  }
  const sources = list
    .map((item) =>
      item && typeof item === "object"
        ? normalizeSource(item as Record<string, unknown>)
        : null,
    )
    .filter((s): s is SuperEmbedSource => s !== null);
  return sources;
}

export class SuperEmbedApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "SuperEmbedApiError";
    this.status = status;
  }
}

/**
 * Performs a server-to-server request to the SuperEmbed Data Hub
 * (`seapi.link`). No API key required. Returns the raw text body.
 */
export async function requestSuperEmbedRaw(input: FetchStreamsInput): Promise<string> {
  const { mediaType, id, season, episode, maxResults = 5 } = input;

  const qs = new URLSearchParams({ type: "tmdb", id, max_results: String(maxResults) });
  if (mediaType === "tv") {
    qs.set("season", String(season ?? 1));
    qs.set("episode", String(episode ?? 1));
  }

  const endpoint = `${SUPEREMBED_API_BASE}/?${qs.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let res: globalThis.Response;
  try {
    res = await fetch(endpoint, {
      redirect: "follow",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    throw new SuperEmbedApiError(
      `SuperEmbed API unreachable (${SUPEREMBED_API_BASE}): ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new SuperEmbedApiError(`SuperEmbed API responded ${res.status}`, res.status);
  }
  return res.text();
}