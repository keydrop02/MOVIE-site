import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getMovie,
  getMovieCredits,
  getMovieVideos,
  getMovieRecommendations,
  getMovieWatchProviders,
  getMovieLogo,
  getMovieKeywords,
  getTV,
  getTVCredits,
  getTVVideos,
  getTVRecommendations,
  getTVWatchProviders,
  getTVLogo,
  getTVKeywords,
} from "@/lib/tmdb/client";
import { DetailHero, DetailHeroSkeleton } from "@/components/detail/detail-hero";
import { WatchProviders } from "@/components/detail/watch-providers";
import { CastRail, CastRailSkeleton } from "@/components/cast/cast-rail";
import { TrailerGrid } from "@/components/media/trailer-grid";
import { MediaRail } from "@/components/rails/media-rail";
import { SeasonRail, SeasonRailSkeleton } from "@/components/episodes/season-rail";
import { FavoriteButton } from "@/components/media/favorite-button";
import { PlayButton } from "@/components/media/play-button";
import { AddToListButton } from "@/components/library/add-to-list-button";
import { ANIME_KEYWORD } from "@/lib/constants";
import { formatRuntime, yearFromDate } from "@/lib/utils";

export const revalidate = 1800;

type AnimeType = "movie" | "tv";

export async function generateMetadata({
  params,
}: PageProps<"/anime/[type]/[id]">): Promise<Metadata> {
  const { type, id } = await params;
  try {
    if (type === "movie") {
      const movie = await getMovie(Number(id));
      return { title: `${movie.title ?? "Movie"} — Anime`, description: movie.overview ?? undefined };
    }
    if (type === "tv") {
      const tv = await getTV(Number(id));
      return { title: `${tv.name ?? "TV Show"} — Anime`, description: tv.overview ?? undefined };
    }
    return { title: "Anime" };
  } catch {
    return { title: "Anime" };
  }
}

export default async function AnimeDetailPage({
  params,
}: PageProps<"/anime/[type]/[id]">) {
  const { type, id } = await params;
  const animeType = type as AnimeType;
  if (animeType !== "movie" && animeType !== "tv") notFound();
  const tmdbId = Number(id);

  if (animeType === "movie") {
    const [movie, credits, videos, recommendations, watch, logo, keywordIds] =
      await Promise.all([
        getMovie(tmdbId),
        getMovieCredits(tmdbId).catch(() => ({ id: tmdbId, cast: [], crew: [] })),
        getMovieVideos(tmdbId).catch(() => []),
        getMovieRecommendations(tmdbId, true).catch(() => []),
        getMovieWatchProviders(tmdbId).catch(() => ({ results: {} })),
        getMovieLogo(tmdbId).catch(() => null),
        getMovieKeywords(tmdbId).catch(() => [] as number[]),
      ]);
    if (!movie || !movie.id) notFound();
    if (!keywordIds.includes(ANIME_KEYWORD)) redirect(`/movie/${tmdbId}`);

    const usRelease = (movie.release_dates?.results ?? []).find(
      (r) => r.iso_3166_1 === "US"
    );
    const cert =
      usRelease?.release_dates?.find(
        (d) => d.certification && d.certification !== ""
      )?.certification ?? null;
    const releaseYear = yearFromDate(movie.release_date);
    const meta = [releaseYear, cert, formatRuntime(movie.runtime), movie.status]
      .filter(Boolean)
      .join(" · ");

    const mediaRef = {
      tmdbId: movie.id,
      mediaType: "movie" as const,
      title: movie.title ?? "Movie",
      posterPath: movie.poster_path ?? null,
      rating: movie.vote_average ?? undefined,
    };

    return (
      <div>
        <DetailHero
          backdrop={movie.backdrop_path}
          title={movie.title ?? "Movie"}
          logo={logo}
          tagline={movie.tagline}
          meta={meta}
          description={movie.overview}
          rating={movie.vote_average ?? 0}
          genres={movie.genres}
          actions={
            <>
              <div className="pointer-events-auto">
                <PlayButton media={mediaRef} />
              </div>
              <div className="pointer-events-auto">
                <FavoriteButton media={mediaRef} showLabel />
              </div>
              <div className="pointer-events-auto">
                <AddToListButton media={mediaRef} showLabel />
              </div>
            </>
          }
        />

        <div className="mx-auto w-full max-w-[1440px] pt-4">
          <div className="min-w-0">
            <div className="px-5 md:px-10">
              <WatchProviders results={watch.results} country="US" className="pt-2" />
            </div>

            <CastRail cast={credits.cast ?? []} />

            <TrailerGrid videos={videos} />

            <MediaRail title="More Anime Like This" items={recommendations} />
          </div>
        </div>
      </div>
    );
  }

  const [tv, credits, videos, recommendations, watch, logo, keywordIds] =
    await Promise.all([
      getTV(tmdbId),
      getTVCredits(tmdbId).catch(() => ({ id: tmdbId, cast: [], crew: [] })),
      getTVVideos(tmdbId).catch(() => []),
      getTVRecommendations(tmdbId, true).catch(() => []),
      getTVWatchProviders(tmdbId).catch(() => ({ results: {} })),
      getTVLogo(tmdbId).catch(() => null),
      getTVKeywords(tmdbId).catch(() => [] as number[]),
    ]);
  if (!tv || !tv.id) notFound();
  if (!keywordIds.includes(ANIME_KEYWORD)) redirect(`/tv/${tmdbId}`);

  const seasons = tv.seasons ?? [];
  const realSeasons = seasons
    .filter((s) => (s.season_number ?? 0) > 0 && (s.episode_count ?? 0) > 0)
    .sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0));

  const rating = (tv.content_ratings?.results ?? []).find(
    (r) => r.iso_3166_1 === "US"
  )?.rating;
  const startYear = yearFromDate(tv.first_air_date);
  const endYear = tv.status === "Ended" ? yearFromDate(tv.last_air_date) : "";
  const years = [startYear, endYear].filter(Boolean).join("–") || tv.first_air_date || "";
  const runtime =
    tv.episode_run_time?.[0] ? formatRuntime(tv.episode_run_time[0]) : undefined;
  const meta = [years, rating, runtime, `${tv.number_of_seasons} seasons`]
    .filter(Boolean)
    .join(" · ");

  const mediaRef = {
    tmdbId: tv.id,
    mediaType: "tv" as const,
    title: tv.name ?? "TV Show",
    posterPath: tv.poster_path ?? null,
    rating: tv.vote_average ?? undefined,
  };

  return (
    <div>
      <DetailHero
        backdrop={tv.backdrop_path}
        title={tv.name ?? "TV Show"}
        logo={logo}
        tagline={tv.tagline}
        meta={meta}
        description={tv.overview}
        rating={tv.vote_average ?? 0}
        genres={tv.genres}
        actions={
          <>
            <div className="pointer-events-auto">
              <PlayButton media={mediaRef} />
            </div>
            <div className="pointer-events-auto">
              <FavoriteButton media={mediaRef} showLabel />
            </div>
            <div className="pointer-events-auto">
              <AddToListButton media={mediaRef} showLabel />
            </div>
          </>
        }
      />

      <div className="mx-auto w-full max-w-[1440px] pt-4">
        <div className="min-w-0">
          <div className="px-5 md:px-10">
            <WatchProviders results={watch.results} country="US" className="pt-2" />
          </div>

          <CastRail cast={credits.cast ?? []} />

          <TrailerGrid videos={videos} />

          {realSeasons.length > 0 && <SeasonRail tvId={tmdbId} seasons={realSeasons} />}

          <MediaRail title="More Anime Like This" items={recommendations} />
        </div>
      </div>
    </div>
  );
}

export function AnimePageSkeleton() {
  return (
    <div>
      <DetailHeroSkeleton />
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <CastRailSkeleton />
        <SeasonRailSkeleton />
        <div className="py-5 sm:py-6">
          <div className="mb-3 h-7 w-48 animate-pulse rounded bg-white/[0.06]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, j) => (
              <div
                key={j}
                className="h-56 w-[170px] flex-none animate-pulse rounded-2xl bg-white/[0.05]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
