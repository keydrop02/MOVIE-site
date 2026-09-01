import type { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api";
import {
  getCachedStreams,
  setCachedStreams,
  gateRateLimit,
} from "@/lib/player/superembed/cache";
import {
  parsePayload,
  requestSuperEmbedRaw,
  SuperEmbedApiError,
} from "@/lib/player/superembed/api";

export const dynamic = "force-dynamic";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * GET /api/stream/sources?type=movie|tv&id={tmdbId}[&season=&episode=&max_results=1-5]
 *
 * Returns the SuperEmbed server list (cached locally for 48h per the upstream
 * terms). On cache miss it fetches once from the SuperEmbed Data Hub and
 * stores the result in the bundled SQLite `stream_cache` table.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const type = sp.get("type");
    if (type !== "movie" && type !== "tv") {
      return jsonError("'type' must be 'movie' or 'tv'", 400);
    }

    const id = sp.get("id")?.trim();
    if (!id) return jsonError("'id' is required", 400);

    const season = sp.get("season") ? Number(sp.get("season")) : undefined;
    const episode = sp.get("episode") ? Number(sp.get("episode")) : undefined;
    const maxResultsRaw = Number(sp.get("max_results") ?? "5");
    const maxResults = Number.isFinite(maxResultsRaw)
      ? Math.min(5, Math.max(1, Math.trunc(maxResultsRaw)))
      : 5;

    const seasonEpisode = type === "tv" ? `S${pad2(season ?? 1)}E${pad2(episode ?? 1)}` : "MOVIE";
    const key: { mediaType: "movie" | "tv"; mediaId: string; seasonEpisode: string } = {
      mediaType: type,
      mediaId: id,
      seasonEpisode,
    };

    // 1. Serve from the 48h cache when possible.
    const cached = getCachedStreams(key.mediaType, key.mediaId, key.seasonEpisode);
    if (cached) {
      return jsonOk({
        cached: true,
        updatedAt: new Date(cached.updatedAtMs).toISOString(),
        sources: parsePayload(cached.payload),
      });
    }

    // 2. Cache miss: respect the 10 req / 10 s / IP limit, then fetch fresh.
    await gateRateLimit();
    const raw = await requestSuperEmbedRaw({
      mediaType: type,
      id,
      season: season ?? undefined,
      episode: episode ?? undefined,
      maxResults,
    });
    setCachedStreams(key.mediaType, key.mediaId, key.seasonEpisode, raw);

    return jsonOk({
      cached: false,
      sources: parsePayload(raw),
    });
  } catch (error) {
    if (error instanceof SuperEmbedApiError) {
      return jsonError(error.message, error.status ?? 502);
    }
    return jsonError(error instanceof Error ? error.message : "Something went wrong", 500);
  }
}