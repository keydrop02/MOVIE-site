import "server-only";
import { discoverMovies } from "./movies";
import { discoverSeries } from "./tv";
import type { DiscoverParams } from "./tmdb";
import type { MediaItem } from "./types";

const RAIL_SIZE = 12;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function items(
  type: "movie" | "tv",
  params: DiscoverParams
): Promise<MediaItem[]> {
  const data =
    type === "movie"
      ? await discoverMovies(params)
      : await discoverSeries(params);
  return data.items.slice(0, RAIL_SIZE);
}

async function itemsBoth(params: DiscoverParams): Promise<MediaItem[]> {
  const [m, t] = await Promise.all([
    discoverMovies(params),
    discoverSeries(params),
  ]);
  const seen = new Set<string>();
  return [...m.items, ...t.items]
    .filter((i) => (seen.has(i.id) ? false : seen.add(i.id)))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, RAIL_SIZE);
}

/* ------------------------------------------------------------------ */
/* Section 3 — Browse by Mood                                         */
/* ------------------------------------------------------------------ */

export interface MoodDef {
  slug: string;
  label: string;
  genreIds: number[];
  sort: string;
  type: "movie" | "tv" | "both";
}

export const MOODS: MoodDef[] = [
  { slug: "feel-good", label: "Feel Good", genreIds: [35, 10751], sort: "popularity.desc", type: "both" },
  { slug: "dark", label: "Dark", genreIds: [27, 53, 80], sort: "vote_average.desc", type: "both" },
  { slug: "emotional", label: "Emotional", genreIds: [18, 10749], sort: "vote_average.desc", type: "both" },
  { slug: "mind-bending", label: "Mind-Bending", genreIds: [878, 9648], sort: "vote_average.desc", type: "both" },
  { slug: "epic", label: "Epic", genreIds: [12, 28, 14], sort: "popularity.desc", type: "both" },
  { slug: "funny", label: "Funny", genreIds: [35], sort: "vote_average.desc", type: "both" },
  { slug: "suspenseful", label: "Suspenseful", genreIds: [53, 9648, 27], sort: "popularity.desc", type: "both" },
  { slug: "relaxing", label: "Relaxing", genreIds: [16, 35, 10751], sort: "popularity.desc", type: "both" },
];

export function getMoodGenreHref(mood: MoodDef): string {
  const ids = mood.genreIds.join(",");
  return `/genre/movie/${ids}?sort=popular`;
}

export async function getMoodItems(mood: MoodDef): Promise<MediaItem[]> {
  const params: DiscoverParams = {
    sort_by: mood.sort,
    with_genres: mood.genreIds.join(","),
    "vote_count.gte": 30,
  };
  if (mood.type === "both") return itemsBoth(params);
  return items(mood.type, params);
}

/* ------------------------------------------------------------------ */
/* Section 5 — Curated Collections                                    */
/* ------------------------------------------------------------------ */

export interface CollectionDef {
  slug: string;
  label: string;
  params: DiscoverParams;
  type: "movie" | "tv" | "both";
}

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "hidden-gems",
    label: "Hidden Gems",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 50, "vote_count.lte": 200, "vote_average.gte": 7 },
    type: "both",
  },
  {
    slug: "award-winners",
    label: "Award Winners",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 500 },
    type: "movie",
  },
  {
    slug: "critics-picks",
    label: "Critics' Picks",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 1000 },
    type: "both",
  },
  {
    slug: "cult-classics",
    label: "Cult Classics",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 200, "vote_count.lte": 600, "vote_average.gte": 7, "primary_release_date.lte": "2010-01-01" },
    type: "movie",
  },
  {
    slug: "underrated",
    label: "Underrated",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 20, "vote_count.lte": 100, "vote_average.gte": 7 },
    type: "both",
  },
  {
    slug: "one-night-binge",
    label: "One-Night Binge",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 100, "vote_average.gte": 7 },
    type: "tv",
  },
  {
    slug: "true-stories",
    label: "Based on True Stories",
    params: { sort_by: "popularity.desc", with_genres: "18,99", "vote_count.gte": 50 },
    type: "movie",
  },
  {
    slug: "must-watch",
    label: "Must Watch",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 2000 },
    type: "both",
  },
];

export async function getCollectionItems(col: CollectionDef): Promise<MediaItem[]> {
  if (col.type === "both") return itemsBoth(col.params);
  return items(col.type, col.params);
}

/* ------------------------------------------------------------------ */
/* Section 6 — Browse by Era                                          */
/* ------------------------------------------------------------------ */

export interface EraDef {
  slug: string;
  label: string;
  gte: string;
  lte: string;
}

export const ERAS: EraDef[] = [
  { slug: "2020s", label: "2020s", gte: "2020-01-01", lte: today() },
  { slug: "2010s", label: "2010s", gte: "2010-01-01", lte: "2019-12-31" },
  { slug: "2000s", label: "2000s", gte: "2000-01-01", lte: "2009-12-31" },
  { slug: "1990s", label: "1990s", gte: "1990-01-01", lte: "1999-12-31" },
  { slug: "1980s", label: "1980s", gte: "1980-01-01", lte: "1989-12-31" },
  { slug: "classics", label: "Classics", gte: "1900-01-01", lte: "1979-12-31" },
];

export async function getEraItems(era: EraDef): Promise<MediaItem[]> {
  return itemsBoth({
    sort_by: "popularity.desc",
    "primary_release_date.gte": era.gte,
    "primary_release_date.lte": era.lte,
    "vote_count.gte": 30,
  });
}

/* ------------------------------------------------------------------ */
/* Section 7 — Popular Platforms                                      */
/* ------------------------------------------------------------------ */

export interface PlatformDef {
  slug: string;
  label: string;
  providerId: number;
}

export const PLATFORMS: PlatformDef[] = [
  { slug: "netflix", label: "Netflix", providerId: 8 },
  { slug: "prime-video", label: "Prime Video", providerId: 9 },
  { slug: "disney-plus", label: "Disney+", providerId: 337 },
  { slug: "max", label: "Max", providerId: 384 },
  { slug: "apple-tv-plus", label: "Apple TV+", providerId: 350 },
  { slug: "hulu", label: "Hulu", providerId: 15 },
  { slug: "crunchyroll", label: "Crunchyroll", providerId: 283 },
  { slug: "paramount-plus", label: "Paramount+", providerId: 531 },
];

export async function getPlatformItems(platform: PlatformDef): Promise<MediaItem[]> {
  return itemsBoth({
    sort_by: "popularity.desc",
    with_watch_providers: String(platform.providerId),
    watch_region: "US",
    "vote_count.gte": 30,
  });
}

/* ------------------------------------------------------------------ */
/* Section 8 — International Cinema                                   */
/* ------------------------------------------------------------------ */

export interface InternationalDef {
  slug: string;
  label: string;
  countryCode: string;
  flag: string;
}

export const INTERNATIONAL: InternationalDef[] = [
  { slug: "korean", label: "Korean", countryCode: "KR", flag: "\ud83c\uddf0\ud83c\uddf7" },
  { slug: "japanese", label: "Japanese", countryCode: "JP", flag: "\ud83c\uddef\ud83c\uddf5" },
  { slug: "indian", label: "Indian", countryCode: "IN", flag: "\ud83c\uddee\ud83c\uddf3" },
  { slug: "french", label: "French", countryCode: "FR", flag: "\ud83c\uddeb\ud83c\uddf7" },
  { slug: "spanish", label: "Spanish", countryCode: "ES", flag: "\ud83c\uddea\ud83c\uddf8" },
  { slug: "italian", label: "Italian", countryCode: "IT", flag: "\ud83c\uddee\ud83c\uddf9" },
];

export async function getInternationalItems(region: InternationalDef): Promise<MediaItem[]> {
  return itemsBoth({
    sort_by: "popularity.desc",
    with_origin_country: region.countryCode,
    "vote_count.gte": 10,
  });
}

/* ------------------------------------------------------------------ */
/* Backdrop helpers — fetch one item per category for tile images      */
/* ------------------------------------------------------------------ */

async function firstBackdrop(
  type: "movie" | "tv" | "both",
  params: DiscoverParams
): Promise<string | undefined> {
  let results: MediaItem[];
  if (type === "both") {
    results = await itemsBoth(params);
  } else {
    results = await items(type, params);
  }
  return results[0]?.backdropPath;
}

export async function getMoodBackdrop(mood: MoodDef): Promise<string | undefined> {
  return firstBackdrop(mood.type, {
    sort_by: mood.sort,
    with_genres: mood.genreIds.join(","),
    "vote_count.gte": 30,
  });
}

export async function getEraBackdrop(era: EraDef): Promise<string | undefined> {
  return firstBackdrop("both", {
    sort_by: "popularity.desc",
    "primary_release_date.gte": era.gte,
    "primary_release_date.lte": era.lte,
    "vote_count.gte": 30,
  });
}

export async function getCollectionBackdrop(col: CollectionDef): Promise<string | undefined> {
  return firstBackdrop(col.type, col.params);
}

export async function getInternationalBackdrop(region: InternationalDef): Promise<string | undefined> {
  return firstBackdrop("both", {
    sort_by: "popularity.desc",
    with_origin_country: region.countryCode,
    "vote_count.gte": 10,
  });
}
