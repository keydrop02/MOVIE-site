import "server-only";
import { yearOf } from "@/lib/utils";
import type {
  CastMember,
  CrewMember,
  Episode,
  MediaDetails,
  MediaItem,
  Paginated,
  SeasonSummary,
  TmdbCastMember,
  TmdbCrewMember,
  TmdbEpisodeSummary,
  TmdbMediaResult,
  TmdbMovieDetailWithAppends,
  TmdbPaginated,
  TmdbSeasonDetail,
  TmdbSeasonSummary,
  TmdbTvDetailWithAppends,
} from "./types";

const TRAILER_TYPE_PRIORITY = ["Trailer", "Teaser", "Clip"];
const TRAILER_SITE = "YouTube";

function pickTitle(result: TmdbMediaResult): string {
  return result.title || result.name || result.original_title || result.original_name || "Untitled";
}

export function inferMediaType(result: TmdbMediaResult, fallback: "movie" | "tv" = "movie"): "movie" | "tv" {
  if (result.media_type === "movie" || result.media_type === "tv") return result.media_type;
  if (result.first_air_date || result.name) return "tv";
  if (result.release_date || result.title) return "movie";
  return fallback;
}

export function normalizeMedia(result: TmdbMediaResult, typeOverride?: "movie" | "tv"): MediaItem {
  const type = typeOverride ?? inferMediaType(result);
  const date = result.release_date ?? result.first_air_date;
  return {
    id: `${type}-${result.id}`,
    tmdbId: result.id,
    type,
    title: pickTitle(result),
    originalTitle: result.original_title ?? result.original_name,
    overview: result.overview?.trim() || undefined,
    posterPath: result.poster_path ?? undefined,
    backdropPath: result.backdrop_path ?? undefined,
    releaseDate: date || undefined,
    year: yearOf(date),
    rating: result.vote_average && result.vote_average > 0 ? result.vote_average : undefined,
    voteCount: result.vote_count,
    popularity: result.popularity,
    genreIds: result.genre_ids,
  };
}

export function normalizePaginated(
  response: TmdbPaginated<TmdbMediaResult>,
  typeOverride?: "movie" | "tv"
): Paginated<MediaItem> {
  return {
    page: response.page,
    totalPages: Math.min(response.total_pages ?? 1, 500),
    totalResults: response.total_results ?? 0,
    items: (response.results ?? []).map((r) => normalizeMedia(r, typeOverride)),
  };
}

function normalizeCast(cast?: TmdbCastMember[]): CastMember[] {
  if (!cast?.length) return [];
  return cast
    .filter((member) => member.name)
    .slice(0, 24)
    .map((member, index) => ({
      id: member.id,
      name: member.name,
      character: member.character ?? member.roles?.[0]?.character,
      profilePath: member.profile_path ?? undefined,
      order: member.order ?? index,
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeCrew(crew?: TmdbCrewMember[]): CrewMember[] {
  if (!crew?.length) return [];
  const seen = new Set<string>();
  const out: CrewMember[] = [];
  for (const member of crew) {
    const key = `${member.id}-${member.job}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: member.id, name: member.name, job: member.job });
  }
  return out;
}

function pickTrailer(videos?: { results?: { key: string; name: string; site: string; type: string; official: boolean }[] }) {
  const list = videos?.results?.filter((v) => v.site === TRAILER_SITE) ?? [];
  for (const type of TRAILER_TYPE_PRIORITY) {
    const officialFirst = list
      .filter((v) => v.type === type)
      .sort((a, b) => Number(b.official) - Number(a.official));
    if (officialFirst[0]) {
      return { key: officialFirst[0].key, name: officialFirst[0].name, site: officialFirst[0].site, type: officialFirst[0].type };
    }
  }
  return undefined;
}

function toPaginatedItems(response?: TmdbPaginated<TmdbMediaResult>, override?: "movie" | "tv"): MediaItem[] {
  return (response?.results ?? []).map((r) => normalizeMedia(r, override));
}

export function normalizeMovieDetail(detail: TmdbMovieDetailWithAppends, imdbRating?: string): MediaDetails {
  return {
    ...normalizeMedia({ ...detail, media_type: "movie" }, "movie"),
    status: detail.status,
    tagline: detail.tagline || undefined,
    runtime: detail.runtime ?? undefined,
    genres: detail.genres ?? [],
    cast: normalizeCast(detail.credits?.cast),
    crew: normalizeCrew(detail.credits?.crew),
    trailer: pickTrailer(detail.videos),
    recommendations: toPaginatedItems(detail.recommendations, "movie"),
    similar: toPaginatedItems(detail.similar, "movie"),
    imdbId: detail.imdb_id ?? detail.external_ids?.imdb_id ?? undefined,
    imdbRating,
    homepage: detail.homepage || undefined,
    productionCompanies: (detail.production_companies ?? []).slice(0, 8).map((c) => ({ id: c.id, name: c.name })),
  };
}

export function normalizeSeasonSummary(season: TmdbSeasonSummary): SeasonSummary {
  return {
    id: season.id,
    name: season.name,
    seasonNumber: season.season_number,
    episodeCount: season.episode_count,
    posterPath: season.poster_path ?? undefined,
    airDate: season.air_date ?? undefined,
    overview: season.overview || undefined,
  };
}

export function normalizeTvDetail(detail: TmdbTvDetailWithAppends, imdbRating?: string): MediaDetails {
  const seasons = (detail.seasons ?? [])
    .filter((s) => s.season_number > 0 && s.episode_count > 0)
    .map(normalizeSeasonSummary);

  return {
    ...normalizeMedia({ ...detail, media_type: "tv" }, "tv"),
    status: detail.status,
    tagline: detail.tagline || undefined,
    runtime: detail.episode_run_time?.[0],
    episodeRunTime: detail.episode_run_time,
    genres: detail.genres ?? [],
    cast: normalizeCast(detail.credits?.cast),
    // TMDB keeps show-level authorship in `created_by` — `credits.crew` is
    // per-episode and usually empty for series.
    crew: [
      ...normalizeCrew(detail.credits?.crew),
      ...(detail.created_by ?? []).map((person) => ({
        id: person.id,
        name: person.name,
        job: "Creator",
      })),
    ],
    trailer: pickTrailer(detail.videos),
    recommendations: toPaginatedItems(detail.recommendations, "tv"),
    similar: toPaginatedItems(detail.similar, "tv"),
    imdbId: detail.external_ids?.imdb_id ?? undefined,
    imdbRating,
    homepage: detail.homepage || undefined,
    numberOfSeasons: detail.number_of_seasons,
    numberOfEpisodes: detail.number_of_episodes,
    seasons,
    networks: (detail.networks ?? []).map((n) => ({ id: n.id, name: n.name })),
    productionCompanies: (detail.production_companies ?? []).slice(0, 8).map((c) => ({ id: c.id, name: c.name })),
    lastAirDate: detail.last_episode_to_air?.air_date ?? undefined,
    nextEpisodeAirDate: detail.next_episode_to_air?.air_date ?? undefined,
  };
}

export function normalizeEpisode(episode: TmdbEpisodeSummary): Episode {
  return {
    id: episode.id,
    name: episode.name,
    episodeNumber: episode.episode_number,
    seasonNumber: episode.season_number,
    overview: episode.overview?.trim() || undefined,
    stillPath: episode.still_path ?? undefined,
    runtime: episode.runtime ?? undefined,
    airDate: episode.air_date ?? undefined,
    rating: episode.vote_average && episode.vote_average > 0 ? episode.vote_average : undefined,
  };
}

export function normalizeSeasonDetail(season: TmdbSeasonDetail): {
  season: SeasonSummary;
  episodes: Episode[];
} {
  return {
    season: {
      id: season.id,
      name: season.name,
      seasonNumber: season.season_number,
      episodeCount: season.episodes?.length ?? 0,
      posterPath: season.poster_path ?? undefined,
      airDate: season.air_date ?? undefined,
    },
    episodes: (season.episodes ?? []).map(normalizeEpisode),
  };
}
