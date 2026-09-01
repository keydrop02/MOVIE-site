export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
  name: string;
}

/**
 * Normalized media shape shared by movies and TV so a single
 * set of UI components (MediaCard, MediaRail, MediaGrid) can
 * render either type.
 */
export interface Media {
  id: number;
  type: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  genres: Genre[];
  genreIds: number[];
  originalLanguage: string | null;
  /** True when the title was fetched/known within an anime (keyword 210024) context. */
  isAnime?: boolean;
  /** Title wordmark logo (path + aspect ratio) when available. */
  logo?: TitleLogoInfo | null;
}

export interface Paginated<T> {
  page: number;
  results: T[];
  totalPages: number;
  totalResults: number;
}

/* ---------------- Raw TMDB payloads ---------------- */

export interface TMDbMovie {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Genre[];
  original_language?: string | null;
  runtime?: number | null;
  media_type?: string;
  adult?: boolean;
}

export interface TMDbMovieDetail extends TMDbMovie {
  budget?: number;
  revenue?: number;
  status?: string;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  spoken_languages?: { english_name?: string; name?: string }[];
  tagline?: string | null;
  imdb_id?: string | null;
  certification?: string | null;
  release_dates?: {
    results?: {
      iso_3166_1?: string;
      release_dates?: { certification?: string; type?: number }[];
    }[];
  };
}

export interface TMDbPersonRole {
  id: number;
  name?: string;
  character?: string;
  job?: string;
  profile_path?: string | null;
  order?: number;
}

export interface TMDbCredits {
  id: number;
  cast?: TMDbPersonRole[];
  crew?: TMDbPersonRole[];
}

export interface TMDbVideo {
  id: string;
  key?: string;
  name?: string;
  site?: string;
  type?: string;
  size?: number;
}

export interface TMDbSeason {
  id?: number;
  name?: string;
  overview?: string;
  air_date?: string | null;
  poster_path?: string | null;
  season_number?: number;
  episode_count?: number;
}

export interface TMDbEpisode {
  id: number;
  name?: string;
  overview?: string;
  air_date?: string | null;
  episode_number?: number;
  season_number?: number;
  still_path?: string | null;
  runtime?: number | null;
  vote_average?: number;
  crew?: TMDbPersonRole[];
  guest_stars?: TMDbPersonRole[];
}

export interface TMDbTVDetail {
  id: number;
  name?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  vote_average?: number;
  vote_count?: number;
  genres?: Genre[];
  genre_ids?: number[];
  original_language?: string | null;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  created_by?: { id: number; name?: string }[];
  networks?: { id: number; name?: string; logo_path?: string | null }[];
  seasons?: TMDbSeason[];
  episode_run_time?: number[];
  tagline?: string | null;
  type?: string;
  content_ratings?: {
    results?: { iso_3166_1?: string; rating?: string }[];
  };
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface TMDbWatchProviders {
  results: {
    [country: string]: {
      flatrate?: WatchProvider[];
      rent?: WatchProvider[];
      buy?: WatchProvider[];
    };
  };
}

export interface WatchProviderList {
  results: (WatchProvider & { display_priorities?: Record<string, number> })[];
}

export interface TMDbCollection {
  id: number;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  parts?: TMDbMovie[];
}

export interface TMDbImageAsset {
  file_path?: string | null;
  iso_639_1?: string | null;
  aspect_ratio?: number;
  vote_average?: number;
  width?: number;
  height?: number;
  file_type?: string;
}

export interface TMDbImages {
  id?: number;
  backdrops?: TMDbImageAsset[];
  posters?: TMDbImageAsset[];
  logos?: TMDbImageAsset[];
}

/**
 * A chosen title wordmark logo plus its aspect ratio (width/height), used
 * so the UI can scale logos to a consistent visual footprint regardless of
 * each artwork's intrinsic proportions.
 */
export interface TitleLogoInfo {
  path: string | null;
  ratio: number;
}
