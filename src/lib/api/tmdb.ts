import "server-only";
import { tmdbGet } from "./client";
import type {
  TmdbCombinedCredits,
  TmdbCredits,
  TmdbGenre,
  TmdbMediaResult,
  TmdbMovieDetailWithAppends,
  TmdbPaginated,
  TmdbPersonDetail,
  TmdbPersonResult,
  TmdbSeasonDetail,
  TmdbTrendingResponse,
  TmdbTvDetailWithAppends,
} from "./types";

/** Server-side cache lifetimes (seconds). */
export const CACHE = {
  trending: 60 * 30,
  catalog: 60 * 60,
  details: 60 * 60 * 6,
  seasons: 60 * 60 * 6,
  people: 60 * 60 * 6,
  genres: 60 * 60 * 24,
  search: 30,
} as const;

export const DETAIL_APPEND = [
  "videos",
  "credits",
  "recommendations",
  "similar",
  "external_ids",
].join(",");

export function getTrending(
  type: "all" | "movie" | "tv",
  window: "day" | "week",
  page = 1
) {
  return tmdbGet<TmdbTrendingResponse<TmdbMediaResult>>(
    `/trending/${type}/${window}`,
    { page },
    { revalidate: CACHE.trending, tags: ["trending"] }
  );
}

export function getMovieList(
  list: "popular" | "top_rated" | "now_playing" | "upcoming",
  page = 1
) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    `/movie/${list}`,
    { page },
    { revalidate: CACHE.catalog, tags: [`movie-${list}`] }
  );
}

export function getTvList(
  list: "popular" | "top_rated" | "on_the_air" | "airing_today",
  page = 1
) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    `/tv/${list}`,
    { page },
    { revalidate: CACHE.catalog, tags: [`tv-${list}`] }
  );
}

export function getMovieDetail(id: number | string) {
  return tmdbGet<TmdbMovieDetailWithAppends>(
    `/movie/${id}`,
    { append_to_response: DETAIL_APPEND },
    { revalidate: CACHE.details, tags: [`movie-${id}`] }
  );
}

export function getTvDetail(id: number | string) {
  return tmdbGet<TmdbTvDetailWithAppends>(
    `/tv/${id}`,
    { append_to_response: DETAIL_APPEND },
    { revalidate: CACHE.details, tags: [`tv-${id}`] }
  );
}

export function getSeasonDetail(tvId: number | string, seasonNumber: number | string) {
  return tmdbGet<TmdbSeasonDetail>(
    `/tv/${tvId}/season/${seasonNumber}`,
    {},
    { revalidate: CACHE.seasons, tags: [`tv-${tvId}`, `season-${tvId}-${seasonNumber}`] }
  );
}

export function getRecommendations(type: "movie" | "tv", id: number | string, page = 1) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    `/${type}/${id}/recommendations`,
    { page },
    { revalidate: CACHE.details, tags: [`${type}-${id}`] }
  );
}

export function getSimilar(type: "movie" | "tv", id: number | string, page = 1) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    `/${type}/${id}/similar`,
    { page },
    { revalidate: CACHE.details, tags: [`${type}-${id}`] }
  );
}

export function getCredits(type: "movie" | "tv", id: number | string) {
  return tmdbGet<TmdbCredits>(
    `/${type}/${id}/credits`,
    {},
    { revalidate: CACHE.details, tags: [`${type}-${id}`] }
  );
}

export function searchMulti(query: string, page = 1) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    "/search/multi",
    { query, page, include_adult: false },
    { revalidate: CACHE.search, timeout: 3_000, retries: 1 }
  );
}

export function searchByType(type: "movie" | "tv", query: string, page = 1) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    `/search/${type}`,
    { query, page, include_adult: false },
    { revalidate: CACHE.search, timeout: 3_000, retries: 1 }
  );
}

export function searchPerson(query: string, page = 1) {
  return tmdbGet<TmdbPaginated<TmdbPersonResult>>(
    "/search/person",
    { query, page, include_adult: false },
    { revalidate: CACHE.search, timeout: 3_000, retries: 1 }
  );
}

export function getGenreList(type: "movie" | "tv") {
  return tmdbGet<{ genres: TmdbGenre[] }>(
    `/genre/${type}/list`,
    {},
    { revalidate: CACHE.genres, tags: [`genres-${type}`] }
  );
}

export interface DiscoverParams {
  page?: number;
  sort_by?: string;
  with_genres?: string;
  "vote_count.gte"?: number;
  "vote_count.lte"?: number;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "primary_release_date.lte"?: string;
  "primary_release_date.gte"?: string;
  "first_air_date.gte"?: string;
  "first_air_date.lte"?: string;
  with_origin_country?: string;
  with_watch_providers?: string;
  watch_region?: string;
  include_adult?: boolean;
}

export function getDiscover(type: "movie" | "tv", params: DiscoverParams = {}) {
  return tmdbGet<TmdbPaginated<TmdbMediaResult>>(
    `/discover/${type}`,
    { include_adult: false, ...params },
    { revalidate: CACHE.catalog, tags: [`discover-${type}`] }
  );
}

export function getPersonDetail(id: number | string) {
  return tmdbGet<TmdbPersonDetail>(
    `/person/${id}`,
    {},
    { revalidate: CACHE.people, tags: [`person-${id}`] }
  );
}

export function getPersonCombinedCredits(id: number | string) {
  return tmdbGet<TmdbCombinedCredits>(
    `/person/${id}/combined_credits`,
    {},
    { revalidate: CACHE.people, tags: [`person-${id}`] }
  );
}
