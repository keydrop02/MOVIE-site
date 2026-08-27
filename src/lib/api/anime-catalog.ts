import "server-only";
import { discoverMovies } from "./movies";
import { discoverSeries } from "./tv";
import type { DiscoverParams } from "./tmdb";
import type { MediaItem } from "./types";

/**
 * Anime catalog backed by TMDB Discover: Japanese-origin titles in the
 * Animation genre. Items carry an explicit `href` into `/anime/[type]/[id]`
 * so catalog cards open the dedicated anime detail pages.
 */

const JP_ANIMATION = {
  with_origin_country: "JP",
  with_genres: "16",
} as const;

const RAIL_SIZE = 20;

function isoDate(daysOffset: number): string {
  return new Date(Date.now() + daysOffset * 86_400_000).toISOString().slice(0, 10);
}

function withAnimeHref(items: MediaItem[], type: "tv" | "movie"): MediaItem[] {
  return items.map((item) => ({ ...item, href: `/anime/${type}/${item.tmdbId}` }));
}

async function animeTv(params: DiscoverParams): Promise<MediaItem[]> {
  const { items } = await discoverSeries({ ...JP_ANIMATION, ...params });
  return withAnimeHref(items, "tv");
}

async function animeMovies(params: DiscoverParams): Promise<MediaItem[]> {
  const { items } = await discoverMovies({ ...JP_ANIMATION, ...params });
  return withAnimeHref(items, "movie");
}

/** Currently most popular released anime, series and films ranked together. */
export async function getTrendingAnime(): Promise<MediaItem[]> {
  const today = isoDate(0);
  const [tv, movies] = await Promise.all([
    animeTv({ sort_by: "popularity.desc", "first_air_date.lte": today }),
    animeMovies({ sort_by: "popularity.desc", "primary_release_date.lte": today }),
  ]);
  return [...tv, ...movies]
    .sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
    .slice(0, RAIL_SIZE);
}

export async function getPopularAnime(): Promise<MediaItem[]> {
  return getTrendingAnime();
}

/** Community top rated, with a vote-count floor to skip obscure titles. */
export async function getTopRatedAnime(): Promise<MediaItem[]> {
  const [tv, movies] = await Promise.all([
    animeTv({ sort_by: "vote_average.desc", "vote_count.gte": 200 }),
    animeMovies({ sort_by: "vote_average.desc", "vote_count.gte": 300 }),
  ]);
  return [...tv, ...movies]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, RAIL_SIZE);
}

/** Series that started airing within the last ~120 days. */
export async function getLatestAnime(): Promise<MediaItem[]> {
  return animeTv({
    sort_by: "first_air_date.desc",
    "first_air_date.gte": isoDate(-120),
    "first_air_date.lte": isoDate(0),
  });
}
