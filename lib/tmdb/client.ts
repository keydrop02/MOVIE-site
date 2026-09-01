import "server-only";
import { TMDB_API_BASE, getTmdbToken } from "./config";
import { cacheGet, cacheSet, CACHE_TTL } from "./cache";
import type {
  Media,
  MediaType,
  Paginated,
  TMDbCredits,
  TMDbMovie,
  TMDbMovieDetail,
  TMDbTVDetail,
  TMDbEpisode,
  TMDbSeason,
  TMDbVideo,
  TMDbWatchProviders,
  WatchProviderList,
  TMDbCollection,
  TMDbImages,
  TMDbImageAsset,
  TitleLogoInfo,
  Genre,
} from "./types";
import { normalizeMovie, normalizeMovieAnime, normalizeTV, normalizeTVAnime } from "./normalize";

interface TMDbResult {
  page?: number;
  results?: unknown[];
  total_pages?: number;
  total_results?: number;
}

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(
  params: Record<string, QueryValue | QueryValue[]>
): URLSearchParams {
  const search = new URLSearchParams();
  search.set("api_key", getTmdbToken());
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      search.set(key, value.filter(Boolean).join(","));
    } else {
      search.set(key, String(value));
    }
  }
  return search;
}

class TMDbError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Central server-side TMDB fetch with TTL caching.
 * Authentication is done with api_key and never exposed to the client.
 */
async function fetchWithRetry(
  url: string,
  timeoutMs: number,
  maxAttempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
  }
  throw lastErr;
}

async function tmdbFetch<T>(
  path: string,
  opts: {
    params?: Record<string, QueryValue | QueryValue[]>;
    ttl?: number;
    cache?: boolean;
    timeoutMs?: number;
    attempts?: number;
  } = {},
): Promise<T> {
  const key = `${path}?${new URLSearchParams(
    (Object.entries(opts.params ?? {}) as [string, string][]).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.join(",") : String(v ?? ""),
    ])
  ).toString()}`;

  if (opts.cache !== false) {
    const cached = cacheGet<T>(key);
    if (cached !== undefined) return cached;
  }

  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.search = buildQuery(opts.params ?? {}).toString();

  let res: Response;
  try {
    // Slow TMDB responses get several attempts with backoff instead of
    // failing on a single timeout. Logo/image fetches pass a shorter
    // timeout so they never block a page during a TMDB slowdown.
    res = await fetchWithRetry(
      url.toString(),
      opts.timeoutMs ?? 10_000,
      opts.attempts ?? 3
    );
  } catch (err) {
    throw new TMDbError(`Failed to reach TMDB: ${(err as Error).message}`, 502);
  }

  if (!res.ok) {
    throw new TMDbError(`TMDB request failed (${res.status})`, res.status);
  }

  const data = (await res.json()) as T;
  if (opts.cache !== false && opts.ttl) {
    cacheSet(key, data, opts.ttl);
  }
  return data;
}

function pageOf<T>(path: string, params: Record<string, QueryValue | QueryValue[]>, ttl: number) {
  return tmdbFetch<TMDbResult>(path, { params, ttl }).then((r) => {
    const results = (r.results ?? []) as T[];
    return results;
  });
}

/* ------------------------------------------------------------------ */
/* Movie & TV list endpoints (all normalized to Media)                  */
/* ------------------------------------------------------------------ */

const LISTS = {
  trendingMovie: (window: "day" | "week") =>
    `/trending/movie/${window}`,
  trendingTV: (window: "day" | "week") => `/trending/tv/${window}`,
  popularMovies: "/movie/popular",
  popularTV: "/tv/popular",
  topRatedMovies: "/movie/top_rated",
  topRatedTV: "/tv/top_rated",
} as const;

export async function getTrendingMovies(
  window: "day" | "week" = "week",
  page = 1
): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(LISTS.trendingMovie(window), { page }, CACHE_TTL.trending);
  return raw.map(normalizeMovie);
}

export async function getTrendingTV(
  window: "day" | "week" = "week",
  page = 1
): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(LISTS.trendingTV(window), { page }, CACHE_TTL.trending);
  return raw.map(normalizeTV);
}

export async function getPopularMovies(page = 1): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(LISTS.popularMovies, { page }, CACHE_TTL.popular);
  return raw.map(normalizeMovie);
}

export async function getPopularTV(page = 1): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(LISTS.popularTV, { page }, CACHE_TTL.popular);
  return raw.map(normalizeTV);
}

export async function getTopRatedMovies(page = 1): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(LISTS.topRatedMovies, { page }, CACHE_TTL.topRated);
  return raw.map(normalizeMovie);
}

export async function getTopRatedTV(page = 1): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(LISTS.topRatedTV, { page }, CACHE_TTL.topRated);
  return raw.map(normalizeTV);
}

/* ------------------------------------------------------------------ */
/* Discover                                                             */
/* ------------------------------------------------------------------ */

export interface DiscoverParams {
  genreIds?: number[];
  keywords?: number[];
  withTextQuery?: string;
  year?: number;
  sortBy?: string;
  minRating?: number;
  minVoteCount?: number;
  language?: string;
  country?: string;
  providers?: number[];
  page?: number;
}

function discoverQuery(p: DiscoverParams) {
  return {
    page: p.page ?? 1,
    with_genres: p.genreIds,
    with_keywords: p.keywords,
    with_text_query: p.withTextQuery,
    year: p.year,
    sort_by: p.sortBy,
    "vote_average.gte": p.minRating,
    "vote_count.gte": p.minVoteCount,
    with_original_language: p.language,
    with_origin_country: p.country,
    with_watch_providers: p.providers,
    watch_region: p.providers?.length ? (p.country ?? "US") : undefined,
    language: "en-US",
  };
}

export async function discoverMovies(params: DiscoverParams): Promise<Paginated<Media>> {
  const raw = await tmdbFetch<TMDbResult & { results: TMDbMovie[] }>(
    "/discover/movie",
    { params: discoverQuery(params), ttl: CACHE_TTL.listing }
  );
  return {
    page: raw.page ?? 1,
    results: (raw.results ?? []).map(normalizeMovie),
    totalPages: raw.total_pages ?? 1,
    totalResults: raw.total_results ?? 0,
  };
}

export async function discoverTV(params: DiscoverParams): Promise<Paginated<Media>> {
  const raw = await tmdbFetch<TMDbResult & { results: TMDbMovie[] }>(
    "/discover/tv",
    { params: discoverQuery(params), ttl: CACHE_TTL.listing }
  );
  return {
    page: raw.page ?? 1,
    results: (raw.results ?? []).map(normalizeTV),
    totalPages: raw.total_pages ?? 1,
    totalResults: raw.total_results ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Search                                                               */
/* ------------------------------------------------------------------ */

export interface SearchResult {
  media: Media;
  knownFor?: string;
}

export async function searchMulti(
  query: string,
  page = 1,
  includePerson = false
): Promise<Paginated<Media>> {
  const raw = await tmdbFetch<TMDbResult & { results: TMDbMovie[] }>("/search/multi", {
    params: { query, page, include_adult: false, language: "en-US" },
    ttl: CACHE_TTL.listing,
  });
  const rows = (raw.results ?? []) as TMDbMovie[];
  const results = rows.filter((r) => {
    if (r.media_type === "movie") return true;
    if (r.media_type === "tv") return true;
    return includePerson;
  });
  return {
    page: raw.page ?? 1,
    results: results.map((r) =>
      r.media_type === "tv" ? normalizeTV(r) : normalizeMovie(r)
    ),
    totalPages: raw.total_pages ?? 1,
    totalResults: raw.total_results ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Detail                                                               */
/* ------------------------------------------------------------------ */

async function getMovieRaw(id: number): Promise<TMDbMovieDetail> {
  return tmdbFetch<TMDbMovieDetail>(`/movie/${id}`, {
    params: { language: "en-US", append_to_response: "release_dates" },
    ttl: CACHE_TTL.detail,
  });
}

export async function getMovie(id: number): Promise<TMDbMovieDetail> {
  return getMovieRaw(id);
}

export async function getMovieCredits(id: number): Promise<TMDbCredits> {
  return tmdbFetch<TMDbCredits>(`/movie/${id}/credits`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
}

export async function getMovieVideos(id: number): Promise<TMDbVideo[]> {
  const raw = await tmdbFetch<{ results?: TMDbVideo[] }>(`/movie/${id}/videos`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
  return raw.results ?? [];
}

export async function getMovieRecommendations(id: number, isAnime = false): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(`/movie/${id}/recommendations`, { }, CACHE_TTL.detail);
  const list = isAnime ? raw.map(normalizeMovieAnime) : raw.map(normalizeMovie);
  if (list.length) return list;
  const similar = await pageOf<TMDbMovie>(`/movie/${id}/similar`, { }, CACHE_TTL.detail);
  return isAnime ? similar.map(normalizeMovieAnime) : similar.map(normalizeMovie);
}

export async function getMovieKeywords(id: number): Promise<number[]> {
  const raw = await tmdbFetch<{ keywords?: { id: number }[] }>(`/movie/${id}/keywords`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
  return (raw.keywords ?? []).map((k) => k.id);
}

export async function getMovieSimilar(id: number): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(`/movie/${id}/similar`, { }, CACHE_TTL.detail);
  return raw.map(normalizeMovie);
}

/* ------------------------------------------------------------------ */
/* TV detail                                                            */
/* ------------------------------------------------------------------ */

export async function getTV(id: number): Promise<TMDbTVDetail> {
  return tmdbFetch<TMDbTVDetail>(`/tv/${id}`, {
    params: { language: "en-US", append_to_response: "content_ratings" },
    ttl: CACHE_TTL.detail,
  });
}

export async function getTVCredits(id: number): Promise<TMDbCredits> {
  return tmdbFetch<TMDbCredits>(`/tv/${id}/credits`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
}

export async function getTVVideos(id: number): Promise<TMDbVideo[]> {
  const raw = await tmdbFetch<{ results?: TMDbVideo[] }>(`/tv/${id}/videos`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
  return raw.results ?? [];
}

export async function getTVRecommendations(id: number, isAnime = false): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(`/tv/${id}/recommendations`, { }, CACHE_TTL.detail);
  const list = isAnime ? raw.map(normalizeTVAnime) : raw.map(normalizeTV);
  if (list.length) return list;
  const similar = await pageOf<TMDbMovie>(`/tv/${id}/similar`, { }, CACHE_TTL.detail);
  return isAnime ? similar.map(normalizeTVAnime) : similar.map(normalizeTV);
}

export async function getTVKeywords(id: number): Promise<number[]> {
  const raw = await tmdbFetch<{ results?: { id: number }[] }>(`/tv/${id}/keywords`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
  return (raw.results ?? []).map((k) => k.id);
}

export async function getTVSimilar(id: number): Promise<Media[]> {
  const raw = await pageOf<TMDbMovie>(`/tv/${id}/similar`, { }, CACHE_TTL.detail);
  return raw.map(normalizeTV);
}

export async function getTVSeason(id: number, season: number): Promise<TMDbSeason & { episodes: TMDbEpisode[] }> {
  return tmdbFetch<TMDbSeason & { episodes: TMDbEpisode[] }>(`/tv/${id}/season/${season}`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
}

/* ------------------------------------------------------------------ */
/* Genres / providers / collections                                     */
/* ------------------------------------------------------------------ */

export async function getGenres(mediaType: MediaType): Promise<Genre[]> {
  const path = mediaType === "movie" ? "/genre/movie/list" : "/genre/tv/list";
  const raw = await tmdbFetch<{ genres?: Genre[] }>(path, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.genresProviders,
  });
  return raw.genres ?? [];
}

export async function getAllGenres(): Promise<{ movie: Genre[]; tv: Genre[] }> {
  const [movie, tv] = await Promise.all([getGenres("movie"), getGenres("tv")]);
  return { movie, tv };
}

export async function getProviders(country = "US"): Promise<WatchProviderList["results"]> {
  const raw = await tmdbFetch<WatchProviderList>("/watch/providers/movie", {
    params: { language: "en-US", watch_region: country },
    ttl: CACHE_TTL.genresProviders,
  });
  return raw.results ?? [];
}

export async function getMovieWatchProviders(id: number): Promise<TMDbWatchProviders> {
  return tmdbFetch<TMDbWatchProviders>(`/movie/${id}/watch/providers`, {
    ttl: CACHE_TTL.detail,
  });
}

export async function getTVWatchProviders(id: number): Promise<TMDbWatchProviders> {
  return tmdbFetch<TMDbWatchProviders>(`/tv/${id}/watch/providers`, {
    ttl: CACHE_TTL.detail,
  });
}

export async function getCollection(id: number): Promise<TMDbCollection> {
  return tmdbFetch<TMDbCollection>(`/collection/${id}`, {
    params: { language: "en-US" },
    ttl: CACHE_TTL.detail,
  });
}

/* ------------------------------------------------------------------ */
/* Title wordmark logos                                                 */
/* ------------------------------------------------------------------ */

export async function getMovieImages(id: number): Promise<TMDbImages> {
  return tmdbFetch<TMDbImages>(`/movie/${id}/images`, {
    ttl: CACHE_TTL.detail,
    timeoutMs: 3500,
    attempts: 1,
  });
}

export async function getTVImages(id: number): Promise<TMDbImages> {
  return tmdbFetch<TMDbImages>(`/tv/${id}/images`, {
    ttl: CACHE_TTL.detail,
    timeoutMs: 3500,
    attempts: 1,
  });
}

/**
 * Pick the best title wordmark logo from an images payload, returning its
 * file_path and aspect ratio. Prefers English (or language-agnostic) logos
 * with the highest community vote. Returns null when there is no usable
 * logo so callers can fall back to rendering the plain text title.
 */
export function pickBestLogo(
  images: TMDbImages | null | undefined
): TitleLogoInfo | null {
  const logos = (images?.logos ?? []).filter((l) => l.file_path);
  if (logos.length === 0) return null;

  const score = (l: TMDbImageAsset): number => {
    const lang = l.iso_639_1;
    const langScore =
      !lang || lang === "en" || lang === "xx" ? 3 : lang === "null" ? 2 : 0;
    return langScore * 1000 + (l.vote_average ?? 0) * 10 + (l.width ?? 0) / 1000;
  };

  const best = logos.reduce<TMDbImageAsset>((a, b) => (score(b) > score(a) ? b : a), logos[0]);
  const ratio =
    best.width && best.height && best.height > 0 ? best.width / best.height : 3;
  return { path: best.file_path ?? null, ratio };
}

export async function getMovieLogo(id: number): Promise<TitleLogoInfo | null> {
  try {
    return pickBestLogo(await getMovieImages(id));
  } catch {
    return null;
  }
}

export async function getTVLogo(id: number): Promise<TitleLogoInfo | null> {
  try {
    return pickBestLogo(await getTVImages(id));
  } catch {
    return null;
  }
}

export async function getTrendingMedia(
  window: "day" | "week" = "week",
  limit = 20
): Promise<Media[]> {
  const [movies, tv] = await Promise.all([
    getTrendingMovies(window, 1),
    getTrendingTV(window, 1),
  ]);
  // Interleave for a balanced carousel
  const combined: Media[] = [];
  const max = Math.max(movies.length, tv.length);
  for (let i = 0; i < max; i++) {
    if (i < movies.length) combined.push(movies[i]);
    if (i < tv.length) combined.push(tv[i]);
  }
  return combined.slice(0, limit);
}

export { TMDbError };
