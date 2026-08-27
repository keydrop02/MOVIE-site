import "server-only";
import { normalizeMedia } from "./normalize";
import { searchByType, searchMulti, searchPerson } from "./tmdb";
import type { MediaItem, Paginated, PersonSummary } from "./types";

export interface SearchSectionMeta {
  page: number;
  totalPages: number;
}

export interface SearchGroups {
  movies: MediaItem[];
  tv: MediaItem[];
  people: PersonSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
  /** Per-section pagination state backing the load-more buttons. */
  sections?: {
    movie: SearchSectionMeta;
    tv: SearchSectionMeta;
    person: SearchSectionMeta;
  };
}

function clampPages(totalPages?: number): number {
  return Math.min(totalPages ?? 1, 500);
}

function normalizePersonResult(person: {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  known_for?: Parameters<typeof normalizeMedia>[0][];
}): PersonSummary {
  return {
    id: person.id,
    name: person.name,
    profilePath: person.profile_path ?? undefined,
    knownForDepartment: person.known_for_department,
    knownFor: (person.known_for ?? [])
      .filter((item) => item.media_type !== "person")
      .slice(0, 3)
      .map((item) => normalizeMedia(item)),
  };
}

/** Dedicated movie results with their own pagination stream. */
export async function searchMovies(
  query: string,
  page = 1
): Promise<Paginated<MediaItem>> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) return { items: [], page: 1, totalPages: 0, totalResults: 0 };
  const data = await searchByType("movie", trimmed, page);
  return {
    items: (data.results ?? []).map((result) =>
      normalizeMedia(result, "movie")
    ),
    page: data.page,
    totalPages: clampPages(data.total_pages),
    totalResults: data.total_results ?? 0,
  };
}

/** Dedicated TV results with their own pagination stream. */
export async function searchTvShows(
  query: string,
  page = 1
): Promise<Paginated<MediaItem>> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) return { items: [], page: 1, totalPages: 0, totalResults: 0 };
  const data = await searchByType("tv", trimmed, page);
  return {
    items: (data.results ?? []).map((result) => normalizeMedia(result, "tv")),
    page: data.page,
    totalPages: clampPages(data.total_pages),
    totalResults: data.total_results ?? 0,
  };
}

/** Dedicated people results with their own pagination stream. */
export async function searchPeople(
  query: string,
  page = 1
): Promise<Paginated<PersonSummary>> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) return { items: [], page: 1, totalPages: 0, totalResults: 0 };
  const data = await searchPerson(trimmed, page);
  return {
    items: (data.results ?? []).map(normalizePersonResult),
    page: data.page,
    totalPages: clampPages(data.total_pages),
    totalResults: data.total_results ?? 0,
  };
}

/**
 * Grouped search across movies, TV and people. Each group comes from its own
 * TMDB endpoint so every section paginates independently. Never cached.
 */
export async function search(query: string, page = 1): Promise<SearchGroups> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) {
    return {
      movies: [],
      tv: [],
      people: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
    };
  }

  const [moviesData, tvData, peopleData] = await Promise.all([
    searchMovies(trimmed, page),
    searchTvShows(trimmed, page),
    searchPeople(trimmed, page),
  ]);

  return {
    movies: moviesData.items,
    tv: tvData.items,
    people: peopleData.items.slice(0, 8),
    page: moviesData.page,
    totalPages: Math.max(moviesData.totalPages, tvData.totalPages),
    totalResults:
      moviesData.totalResults + tvData.totalResults + peopleData.totalResults,
    sections: {
      movie: { page: moviesData.page, totalPages: moviesData.totalPages },
      tv: { page: tvData.page, totalPages: tvData.totalPages },
      person: { page: peopleData.page, totalPages: peopleData.totalPages },
    },
  };
}

/**
 * Combined movie+TV results for the redesigned /search page: one merged,
 * popularity-ranked list, plus each stream's pagination state so the UI can
 * keep loading whichever type still has pages. People are excluded here —
 * they only appear in the navbar overlay.
 */
export interface AllMediaResults {
  items: MediaItem[];
  sections: {
    movie: SearchSectionMeta;
    tv: SearchSectionMeta;
  };
}

export async function searchAllMedia(
  query: string,
  page = 1
): Promise<AllMediaResults> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) {
    return {
      items: [],
      sections: { movie: { page: 1, totalPages: 0 }, tv: { page: 1, totalPages: 0 } },
    };
  }

  const [moviesData, tvData] = await Promise.all([
    searchMovies(trimmed, page),
    searchTvShows(trimmed, page),
  ]);

  const seen = new Set<string>();
  const items = [...moviesData.items, ...tvData.items]
    .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  return {
    items,
    sections: {
      movie: { page: moviesData.page, totalPages: moviesData.totalPages },
      tv: { page: tvData.page, totalPages: tvData.totalPages },
    },
  };
}

export type { Paginated };

/**
 * Single-endpoint overlay search using /search/multi. Returns grouped results
 * (movies, TV, people) from one TMDB call instead of three.
 */
export async function searchQuick(
  query: string,
  page = 1
): Promise<SearchGroups> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) {
    return {
      movies: [],
      tv: [],
      people: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
    };
  }

  const data = await searchMulti(trimmed, page);

  const movies: MediaItem[] = [];
  const tv: MediaItem[] = [];
  const people: PersonSummary[] = [];

  for (const item of data.results ?? []) {
    const mt = (item as { media_type?: string }).media_type;
    if (mt === "movie") {
      movies.push(normalizeMedia(item, "movie"));
    } else if (mt === "tv") {
      tv.push(normalizeMedia(item, "tv"));
    } else if (mt === "person") {
      const p = item as unknown as {
        id: number;
        name: string;
        profile_path?: string | null;
        known_for_department?: string;
      };
      people.push({
        id: p.id,
        name: p.name,
        profilePath: p.profile_path ?? undefined,
        knownForDepartment: p.known_for_department,
        knownFor: [],
      });
    }
  }

  return {
    movies: movies.slice(0, 8),
    tv: tv.slice(0, 8),
    people: people.slice(0, 4),
    page: data.page,
    totalPages: Math.min(data.total_pages ?? 1, 500),
    totalResults: data.total_results ?? 0,
  };
}
