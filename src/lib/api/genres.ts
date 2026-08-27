import "server-only";
import { getDiscover, getGenreList } from "./tmdb";
import { discoverMovies } from "./movies";
import { discoverSeries } from "./tv";
import type { Genre, MediaItem, Paginated } from "./types";

export async function getMovieGenres(): Promise<Genre[]> {
  const data = await getGenreList("movie");
  return data.genres ?? [];
}

export async function getTvGenres(): Promise<Genre[]> {
  const data = await getGenreList("tv");
  return data.genres ?? [];
}

export type CatalogSort = "popular" | "top_rated" | "latest";

const SORT_MAP = {
  popular: {
    movie: { sort_by: "popularity.desc", "vote_count.gte": 30 },
    tv: { sort_by: "popularity.desc", "vote_count.gte": 30 },
  },
  top_rated: {
    movie: { sort_by: "vote_average.desc", "vote_count.gte": 300 },
    tv: { sort_by: "vote_average.desc", "vote_count.gte": 200 },
  },
  latest: {
    movie: {
      sort_by: "primary_release_date.desc",
      "vote_count.gte": 5,
      "primary_release_date.lte": new Date().toISOString().slice(0, 10),
    },
    tv: {
      sort_by: "first_air_date.desc",
      "vote_count.gte": 5,
      "first_air_date.lte": new Date().toISOString().slice(0, 10),
    },
  },
} as const;

/** Browse a genre with a sort filter. `type` must be validated by the caller. */
export async function browseGenre(
  type: "movie" | "tv",
  genreId: number,
  sort: CatalogSort = "popular",
  page = 1
): Promise<Paginated<MediaItem>> {
  const params = { ...SORT_MAP[sort][type], with_genres: String(genreId), page };
  return type === "movie" ? discoverMovies(params) : discoverSeries(params);
}

export { getDiscover };

/** Fetch the backdrop path for the top popular movie in a genre. */
export async function getGenreBackdrop(genreId: number): Promise<string | undefined> {
  const data = await discoverMovies({
    sort_by: "popularity.desc",
    with_genres: String(genreId),
    "vote_count.gte": 30,
  });
  return data.items[0]?.backdropPath ?? undefined;
}
