import "server-only";
import { normalizeMedia } from "./normalize";
import { getTrending as fetchTrending } from "./tmdb";
import type { MediaItem } from "./types";

export type TrendingWindow = "day" | "week";

function toItems(response: Awaited<ReturnType<typeof fetchTrending>>, type?: "movie" | "tv"): MediaItem[] {
  return (response.results ?? []).map((r) => normalizeMedia(r, type));
}

export async function getTrendingAll(window: TrendingWindow = "day") {
  return toItems(await fetchTrending("all", window));
}

export async function getTrendingMovies(window: TrendingWindow = "week"): Promise<MediaItem[]> {
  return toItems(await fetchTrending("movie", window), "movie");
}

export async function getTrendingTv(window: TrendingWindow = "week"): Promise<MediaItem[]> {
  return toItems(await fetchTrending("tv", window), "tv");
}

/** The official TMDB combined chart — movies and TV ranked together in one list. */
export async function getTrendingMixed(
  window: TrendingWindow = "week"
): Promise<{ items: MediaItem[]; totalPages: number }> {
  const response = await fetchTrending("all", window);
  return {
    items: (response.results ?? []).map((r) => normalizeMedia(r)),
    totalPages: Math.min(response.total_pages ?? 1, 500),
  };
}
