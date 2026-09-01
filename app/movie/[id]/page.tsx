import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMovie,
  getMovieCredits,
  getMovieVideos,
  getMovieRecommendations,
  getMovieWatchProviders,
  getMovieLogo,
} from "@/lib/tmdb/client";
import { DetailHero, DetailHeroSkeleton } from "@/components/detail/detail-hero";
import { WatchProviders } from "@/components/detail/watch-providers";
import { CastRail, CastRailSkeleton } from "@/components/cast/cast-rail";
import { TrailerGrid } from "@/components/media/trailer-grid";
import { MediaRail } from "@/components/rails/media-rail";
import { FavoriteButton } from "@/components/media/favorite-button";
import { PlayButton } from "@/components/media/play-button";
import { AddToListButton } from "@/components/library/add-to-list-button";
import { formatRuntime, yearFromDate } from "@/lib/utils";

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovie(Number(id));
    return { title: movie.title ?? "Movie", description: movie.overview ?? undefined };
  } catch {
    return { title: "Movie" };
  }
}

export default async function MoviePage({ params }: PageProps<"/movie/[id]">) {
  const { id } = await params;
  const movieId = Number(id);

  const [movie, credits, videos, recommendations, watch, logo] = await Promise.all([
    getMovie(movieId),
    getMovieCredits(movieId).catch(() => ({ id: movieId, cast: [], crew: [] })),
    getMovieVideos(movieId).catch(() => []),
    getMovieRecommendations(movieId).catch(() => []),
    getMovieWatchProviders(movieId).catch(() => ({ results: {} })),
    getMovieLogo(movieId).catch(() => null),
  ]);
  if (!movie || !movie.id) notFound();

  const usRelease = (movie.release_dates?.results ?? []).find(
    (r) => r.iso_3166_1 === "US"
  );
  const cert =
    usRelease?.release_dates?.find((d) => d.certification && d.certification !== "")?.certification ??
    null;
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

          <MediaRail title="You May Also Like" items={recommendations} />
        </div>
      </div>
    </div>
  );
}

export function MoviePageSkeleton() {
  return (
    <div>
      <DetailHeroSkeleton />
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
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
