import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTV,
  getTVCredits,
  getTVVideos,
  getTVRecommendations,
  getTVWatchProviders,
  getTVLogo,
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
import { formatRuntime, yearFromDate } from "@/lib/utils";
export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const tv = await getTV(Number(id));
    return { title: tv.name ?? "TV Show", description: tv.overview ?? undefined };
  } catch {
    return { title: "TV Show" };
  }
}

export default async function TVPage({ params }: PageProps<"/tv/[id]">) {
  const { id } = await params;
  const tvId = Number(id);

  const [tv, credits, videos, recommendations, watch, logo] = await Promise.all([
    getTV(tvId),
    getTVCredits(tvId).catch(() => ({ id: tvId, cast: [], crew: [] })),
    getTVVideos(tvId).catch(() => []),
    getTVRecommendations(tvId).catch(() => []),
    getTVWatchProviders(tvId).catch(() => ({ results: {} })),
    getTVLogo(tvId).catch(() => null),
  ]);
  if (!tv || !tv.id) notFound();

  const seasons = tv.seasons ?? [];
  const realSeasons = seasons
    .filter((s) => (s.season_number ?? 0) > 0 && (s.episode_count ?? 0) > 0)
    .sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0));

  const rating = (tv.content_ratings?.results ?? []).find((r) => r.iso_3166_1 === "US")?.rating;
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

          {realSeasons.length > 0 && <SeasonRail tvId={tvId} seasons={realSeasons} />}

          <MediaRail title="You May Also Like" items={recommendations} />
        </div>
      </div>
    </div>
  );
}

export function TVPageSkeleton() {
  return (
    <div>
      <DetailHeroSkeleton />
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <SeasonRailSkeleton />
        <CastRailSkeleton />
        <div className="py-5 sm:py-6">
          <div className="mb-3 h-7 w-48 animate-pulse rounded bg-white/[0.06]" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, j) => (
              <div key={j} className="h-56 w-[170px] flex-none animate-pulse rounded-2xl bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
