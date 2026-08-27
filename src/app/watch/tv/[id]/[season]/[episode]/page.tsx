import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getSeries, getEpisodes } from "@/lib/api/tv";
import { truncate } from "@/lib/utils";
import { tmdbImage } from "@/lib/images";
import { getPlaybackProvider } from "@/lib/player/provider";
import { trailerPlaybackSource, wantsTrailer } from "@/lib/player/trailer";
import { detailsHref, namespaceOf } from "@/lib/routes";
import { PlayerArea } from "@/components/player-area";
import { WatchTracker } from "@/components/watch-tracker";
import { SectionHeader } from "@/components/section-header";
import { EpisodeBrowser } from "@/components/episode-browser";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ id: string; season: string; episode: string }>;
  searchParams: Promise<{ trailer?: string | string[]; ns?: string | string[] }>;
};

function parseSegment(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

async function loadContext(
  id: string,
  seasonRaw: string,
  episodeRaw: string,
  tolerateMissingEpisode = false
) {
  const tvId = parseSegment(id);
  const seasonNumber = parseSegment(seasonRaw);
  const episodeNumber = parseSegment(episodeRaw);
  if (tvId == null || seasonNumber == null || episodeNumber == null) notFound();

  // Series and episodes are independent lookups — fetch them together so the
  // page doesn't pay two sequential round-trips.
  const [seriesResult, seasonResult] = await Promise.allSettled([
    getSeries(tvId),
    getEpisodes(tvId, seasonNumber),
  ]);

  if (seriesResult.status === "rejected") {
    const error = seriesResult.reason;
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const series = seriesResult.value;
  const seasonData = seasonResult.status === "fulfilled" ? seasonResult.value : null;

  // Some TMDB series (One Piece, Detective Conan, …) group seasons into arcs
  // with absolute episode numbering, so a requested number may not exist
  // literally. Resolve exactly first, then treat the requested number as a
  // 1-based position within the season — "S2E1" means the arc's first
  // episode. Anything still unresolved renders the shell gracefully instead
  // of 404ing; only bad IDs and missing series hard-fail.
  const episodes = seasonData?.episodes ?? [];
  const episode =
    episodes.find((ep) => ep.episodeNumber === episodeNumber) ??
    (episodeNumber >= 1 && episodeNumber <= episodes.length
      ? episodes[episodeNumber - 1]
      : undefined) ??
    (tolerateMissingEpisode ? episodes[0] : undefined);

  return { series, seasonData, episode: episode ?? null, seasonNumber, episodeNumber };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, season, episode } = await params;
  try {
    const { series, episodeNumber } = await loadContext(id, season, episode);
    void episodeNumber;
    return {
      title: `Watch ${series.title} S${season}`,
      robots: { index: false },
    };
  } catch {
    return { title: "Watch" };
  }
}

export default async function WatchEpisodePage({ params, searchParams }: PageProps) {
  const [{ id, season, episode }, query] = await Promise.all([params, searchParams]);
  const isTrailer = wantsTrailer(query.trailer);
  // Titles opened from the anime section keep their back-links (and episode
  // navigation) inside the `/anime/...` namespace.
  const ns = namespaceOf(query.ns);
  const { series, seasonData, episode: currentEpisode, seasonNumber, episodeNumber } =
    await loadContext(id, season, episode, isTrailer);
  const detailsUrl = detailsHref("tv", series.tmdbId, ns);

  // `?trailer=1` plays the YouTube trailer in the player instead of the
  // regular playback sources.
  const trailerKey = isTrailer ? series.trailer?.key : undefined;
  const sources = trailerKey
    ? [trailerPlaybackSource(trailerKey)]
    : await getPlaybackProvider().getSources({
        type: "tv",
        tmdbId: series.tmdbId,
        title: series.title,
        season: seasonNumber,
        episode: episodeNumber,
      });

  const still = tmdbImage(
    currentEpisode?.stillPath ?? series.backdropPath ?? series.posterPath,
    "still",
    "lg"
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <WatchTracker
        item={{
          tmdbId: series.tmdbId,
          type: "tv",
          title: series.title,
          posterPath: series.posterPath,
          backdropPath: series.backdropPath,
          rating: series.rating,
          year: series.year,
        }}
        seasonEpisode={{ season: seasonNumber, episode: episodeNumber }}
      />
      <Link
        href={`${detailsUrl}?season=${seasonNumber}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to details
      </Link>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        {series.title}
      </h1>

      <div className="mt-4">
        <PlayerArea
          sources={sources}
          poster={still}
          title={series.title}
          item={{
            tmdbId: series.tmdbId,
            type: "tv",
            title: series.title,
            posterPath: series.posterPath,
            backdropPath: series.backdropPath,
            rating: series.rating,
            year: series.year,
          }}
          seasonEpisode={{ season: seasonNumber, episode: episodeNumber }}
        />
      </div>

      <div className="mt-7 max-w-3xl">
        {currentEpisode ? (
          <>
            <p className="font-mono text-xs tracking-widest text-faint uppercase">
              S{String(seasonNumber).padStart(2, "0")} · E
              {String(episodeNumber).padStart(2, "0")}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              {currentEpisode.name}
            </h2>
            {currentEpisode.overview && (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {truncate(currentEpisode.overview, 400)}
              </p>
            )}
          </>
        ) : isTrailer ? (
          <p className="font-mono text-xs tracking-widest text-faint uppercase">
            Trailer
          </p>
        ) : (
          <>
            <p className="font-mono text-xs tracking-widest text-faint uppercase">
              S{String(seasonNumber).padStart(2, "0")} · E
              {String(episodeNumber).padStart(2, "0")}
            </p>
          </>
        )}
      </div>

      {seasonData && seasonData.episodes.length > 0 && (
        <section aria-label="Season episodes" className="mt-12">
          <SectionHeader title="Episodes" />
          <EpisodeBrowser
            tvId={series.tmdbId}
            seasons={series.seasons}
            activeSeason={seasonNumber}
            episodes={seasonData.episodes}
            activeEpisode={currentEpisode?.episodeNumber}
            keepNamespace={ns === "anime"}
          />
        </section>
      )}
    </div>
  );
}
