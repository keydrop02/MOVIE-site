import type { Genre, Media, MediaType, TMDbMovie } from "./types";

function toGenres(raw: TMDbMovie): Genre[] {
  if (Array.isArray(raw.genres)) return raw.genres;
  if (Array.isArray(raw.genre_ids)) {
    return raw.genre_ids.map((id) => ({ id, name: "" }));
  }
  return [];
}

export function normalizeMovie(raw: TMDbMovie): Media {
  return {
    id: raw.id,
    type: "movie",
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    rating: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    genres: toGenres(raw),
    genreIds: raw.genre_ids ?? [],
    originalLanguage: raw.original_language ?? null,
  };
}

export function normalizeMovieAnime(raw: TMDbMovie): Media {
  return { ...normalizeMovie(raw), isAnime: true };
}

export function normalizeTV(raw: TMDbMovie): Media {
  return {
    id: raw.id,
    type: "tv",
    title: raw.name ?? raw.title ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.first_air_date ?? raw.release_date ?? null,
    rating: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    genres: toGenres(raw),
    genreIds: raw.genre_ids ?? [],
    originalLanguage: raw.original_language ?? null,
  };
}

export function normalizeTVAnime(raw: TMDbMovie): Media {
  return { ...normalizeTV(raw), isAnime: true };
}

export function normalizeMedia(
  raw: TMDbMovie,
  type: MediaType
): Media {
  return type === "tv" ? normalizeTV(raw) : normalizeMovie(raw);
}
