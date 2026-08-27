import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getMovie } from "@/lib/api/movies";
import { getPlaybackProvider } from "@/lib/player/provider";
import { trailerPlaybackSource, wantsTrailer } from "@/lib/player/trailer";
import { detailsHref, namespaceOf } from "@/lib/routes";
import type { MediaDetails } from "@/lib/api/types";
import { tmdbImage } from "@/lib/images";
import { PlayerArea } from "@/components/player-area";
import { WatchTracker } from "@/components/watch-tracker";
import { SectionHeader } from "@/components/section-header";
import { MediaGrid } from "@/components/media-grid";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trailer?: string | string[]; ns?: string | string[] }>;
};

async function loadMovie(id: string): Promise<MediaDetails> {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) notFound();
  try {
    return await getMovie(parsed);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await loadMovie(id);
    return { title: `Watch ${movie.title}`, robots: { index: false } };
  } catch {
    return { title: "Watch" };
  }
}

export default async function WatchMoviePage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const movie = await loadMovie(id);
  // Titles opened from the anime section keep their back-links inside the
  // `/anime/...` namespace.
  const ns = namespaceOf(query.ns);
  const detailsUrl = detailsHref("movie", movie.tmdbId, ns);

  // `?trailer=1` plays the YouTube trailer in the player instead of the
  // regular playback sources.
  const trailerKey = wantsTrailer(query.trailer) ? movie.trailer?.key : undefined;
  const sources = trailerKey
    ? [trailerPlaybackSource(trailerKey)]
    : await (async () => {
        const provider = getPlaybackProvider();
        return provider.getSources({
          type: "movie",
          tmdbId: movie.tmdbId,
          title: movie.title,
        });
      })();

  const poster = tmdbImage(movie.backdropPath ?? movie.posterPath, "backdrop", "md");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <WatchTracker
        item={{
          tmdbId: movie.tmdbId,
          type: "movie",
          title: movie.title,
          posterPath: movie.posterPath,
          backdropPath: movie.backdropPath,
          rating: movie.rating,
          year: movie.year,
        }}
      />
      <Link
        href={detailsUrl}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to details
      </Link>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        {movie.title}
      </h1>

      <div className="mt-4">
        <PlayerArea
          sources={sources}
          poster={poster}
          title={movie.title}
          item={{
            tmdbId: movie.tmdbId,
            type: "movie",
            title: movie.title,
            posterPath: movie.posterPath,
            backdropPath: movie.backdropPath,
            rating: movie.rating,
            year: movie.year,
          }}
        />
      </div>

      {(movie.recommendations.length > 0 || movie.similar.length > 0) && (
        <section aria-label="Recommended" className="mt-12">
          <SectionHeader title="Recommended" />
          <MediaGrid items={(movie.recommendations.length ? movie.recommendations : movie.similar).slice(0, 12)} />
        </section>
      )}
    </div>
  );
}
