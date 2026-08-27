import "server-only";
import { getOmdbEnrichment } from "./omdb";
import { normalizeMovieDetail, normalizePaginated } from "./normalize";
import { getDiscover, getMovieDetail, getMovieList } from "./tmdb";
import type { MediaDetails, MediaItem, Paginated } from "./types";

export async function getPopularMovies(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getMovieList("popular", page), "movie");
}

export async function getTopRatedMovies(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getMovieList("top_rated", page), "movie");
}

export async function getNowPlayingMovies(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getMovieList("now_playing", page), "movie");
}

export async function getUpcomingMovies(page = 1): Promise<Paginated<MediaItem>> {
  return normalizePaginated(await getMovieList("upcoming", page), "movie");
}

/** Full movie detail with OMDb enrichment (best effort). */
export async function getMovie(id: number | string): Promise<MediaDetails> {
  const detail = await getMovieDetail(id);
  const enrichment = await getOmdbEnrichment({
    imdbId: detail.imdb_id ?? null,
    title: detail.title,
    year: Number.parseInt((detail.release_date ?? "").slice(0, 4), 10) || undefined,
  });
  return normalizeMovieDetail(detail, enrichment?.imdbRating);
}

export async function discoverMovies(params: Parameters<typeof getDiscover>[1]) {
  return normalizePaginated(await getDiscover("movie", params), "movie");
}
