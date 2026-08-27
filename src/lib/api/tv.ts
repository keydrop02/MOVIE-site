import "server-only";
import { getOmdbEnrichment } from "./omdb";
import { normalizePaginated, normalizeSeasonDetail, normalizeTvDetail } from "./normalize";
import { getDiscover, getSeasonDetail, getTvDetail, getTvList } from "./tmdb";
import type { Episode, MediaDetails, MediaItem, Paginated, SeasonSummary } from "./types";

export async function getPopularTv(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getTvList("popular", page), "tv");
}

export async function getTopRatedTv(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getTvList("top_rated", page), "tv");
}

export async function getOnTheAirTv(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getTvList("on_the_air", page), "tv");
}

export async function getAiringTodayTv(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getTvList("airing_today", page), "tv");
}

/** Full series detail with OMDb enrichment (best effort). */
export async function getSeries(id: number | string): Promise<MediaDetails> {
  const detail = await getTvDetail(id);
  const enrichment = await getOmdbEnrichment({
    imdbId: detail.external_ids?.imdb_id ?? null,
    title: detail.name,
    year: Number.parseInt((detail.first_air_date ?? "").slice(0, 4), 10) || undefined,
  });
  return normalizeTvDetail(detail, enrichment?.imdbRating);
}

export interface SeasonData {
  season: SeasonSummary;
  episodes: Episode[];
}

export async function getEpisodes(tvId: number | string, seasonNumber: number | string): Promise<SeasonData> {
  return normalizeSeasonDetail(await getSeasonDetail(tvId, seasonNumber));
}

export async function discoverSeries(params: Parameters<typeof getDiscover>[1]) {
  return normalizePaginated(await getDiscover("tv", params), "tv");
}
