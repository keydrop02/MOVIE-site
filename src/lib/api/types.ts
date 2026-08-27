export type MediaType = "movie" | "tv";

/* ------------------------------------------------------------------ */
/* TMDB raw response types                                             */
/* ------------------------------------------------------------------ */

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMediaResult {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  popularity?: number;
  adult?: boolean;
  original_language?: string;
  origin_country?: string[];
}

export interface TmdbPaginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbTrendingResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TmdbMovieDetail extends Omit<TmdbMediaResult, "name" | "original_name" | "first_air_date"> {
  title: string;
  runtime: number | null;
  status: string;
  tagline: string | null;
  budget: number | null;
  revenue: number | null;
  homepage: string | null;
  imdb_id: string | null;
  genres: TmdbGenre[];
  production_companies: TmdbProductionCompany[];
  production_countries: TmdbProductionCountry[];
  spoken_languages: TmdbSpokenLanguage[];
  release_dates?: unknown;
}

export interface TmdbSeasonSummary {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  overview: string | null;
}

export interface TmdbCreatedBy {
  id: number;
  name: string;
}

export interface TmdbTvDetail extends Omit<TmdbMediaResult, "title" | "original_title" | "release_date"> {
  name: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  status: string;
  tagline: string | null;
  homepage: string | null;
  genres: TmdbGenre[];
  seasons: TmdbSeasonSummary[];
  created_by?: TmdbCreatedBy[];
  production_companies: TmdbProductionCompany[];
  networks: TmdbNetwork[];
  spoken_languages: TmdbSpokenLanguage[];
  last_episode_to_air?: TmdbEpisodeSummary | null;
  next_episode_to_air?: TmdbEpisodeSummary | null;
}

export interface TmdbEpisodeSummary {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  overview: string | null;
  runtime: number | null;
}

export interface TmdbSeasonDetail {
  id: number;
  name: string;
  season_number: number;
  episodes: TmdbEpisodeSummary[];
  overview: string | null;
  poster_path: string | null;
  air_date: string | null;
  episode_count?: number;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  roles?: { character: string }[];
  profile_path: string | null;
  order?: number;
  known_for_department?: string;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department?: string;
  profile_path?: string | null;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TmdbPersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  known_for?: TmdbMediaResult[];
}

export interface TmdbPersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  homepage: string | null;
  also_known_as: string[];
  gender: number;
}

export interface TmdbCombinedCreditItem {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  character?: string;
  job?: string;
  episode_count?: number;
}

export interface TmdbCombinedCredits {
  id: number;
  cast: TmdbCombinedCreditItem[];
  crew: TmdbCombinedCreditItem[];
}

export interface TmdbAppendables {
  videos?: { results: TmdbVideo[] };
  credits?: TmdbCredits;
  recommendations?: TmdbPaginated<TmdbMediaResult>;
  similar?: TmdbPaginated<TmdbMediaResult>;
  external_ids?: { imdb_id: string | null };
}

export interface TmdbMovieDetailWithAppends extends TmdbMovieDetail {
  videos?: { results: TmdbVideo[] };
  credits?: TmdbCredits;
  recommendations?: TmdbPaginated<TmdbMediaResult>;
  similar?: TmdbPaginated<TmdbMediaResult>;
  external_ids?: { imdb_id: string | null };
}

export interface TmdbTvDetailWithAppends extends TmdbTvDetail {
  videos?: { results: TmdbVideo[] };
  credits?: TmdbCredits;
  recommendations?: TmdbPaginated<TmdbMediaResult>;
  similar?: TmdbPaginated<TmdbMediaResult>;
  external_ids?: { imdb_id: string | null };
}

/* ------------------------------------------------------------------ */
/* OMDb raw response types                                             */
/* ------------------------------------------------------------------ */

export interface OmdbRating {
  Source: string;
  Value: string;
}

export interface OmdbTitleResponse {
  Response: "True" | "False";
  Error?: string;
  Title?: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster?: string;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID?: string;
  Type?: string;
  Ratings?: OmdbRating[];
}

export interface OmdbSearchResponse {
  Response: "True" | "False";
  Error?: string;
  Search?: {
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }[];
  totalResults?: string;
}

/* ------------------------------------------------------------------ */
/* Normalized application models                                       */
/* ------------------------------------------------------------------ */

export interface Genre {
  id: number;
  name: string;
}

export interface MediaItem {
  id: string;
  tmdbId: number;
  type: MediaType;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  year?: number;
  rating?: number;
  voteCount?: number;
  /** TMDB popularity score — used to rank merged search results. */
  popularity?: number;
  genreIds?: number[];
  /** Optional explicit link override; defaults to `/{type}/{tmdbId}`. */
  href?: string;
  /** Optional play-link override (e.g. resume a history title's last episode). */
  watchHref?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profilePath?: string;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
}

export interface SeasonSummary {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  posterPath?: string;
  airDate?: string;
  overview?: string;
}

export interface Episode {
  id: number;
  name: string;
  episodeNumber: number;
  seasonNumber: number;
  overview?: string;
  stillPath?: string;
  runtime?: number;
  airDate?: string;
  rating?: number;
}

export interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MediaDetails extends MediaItem {
  status?: string;
  tagline?: string;
  runtime?: number;
  genres: Genre[];
  cast: CastMember[];
  crew: CrewMember[];
  trailer?: Video;
  recommendations: MediaItem[];
  similar: MediaItem[];
  imdbId?: string;
  imdbRating?: string;
  homepage?: string;
  /* TV only */
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: SeasonSummary[];
  networks?: { id: number; name: string }[];
  productionCompanies?: { id: number; name: string }[];
  episodeRunTime?: number[];
  lastAirDate?: string;
  nextEpisodeAirDate?: string;
}

export interface PersonSummary {
  id: number;
  name: string;
  profilePath?: string;
  knownForDepartment?: string;
  knownFor: MediaItem[];
}

export interface PersonDetail extends PersonSummary {
  biography?: string;
  birthday?: string;
  deathday?: string;
  placeOfBirth?: string;
  alsoKnownAs: string[];
  credits: {
    cast: (MediaItem & { character?: string })[];
    crew: (MediaItem & { job?: string })[];
  };
}

export interface Paginated<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  items: T[];
}
