import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMovie, getTV, getTVSeason, getMovieKeywords, getTVKeywords } from "@/lib/tmdb/client";
import { getEmbedSources } from "@/lib/player/embed-providers";
import { VideoPlayer } from "@/components/media/video-player";
import { WatchRecorder } from "@/components/media/watch-recorder";
import { EpisodeListWithUrl, EpisodeListSkeletonWithUrl } from "@/components/episodes/episode-list-with-url";
import { Suspense } from "react";
import { yearFromDate } from "@/lib/utils";
import { ANIME_KEYWORD } from "@/lib/constants";
import type { TMDbMovieDetail, TMDbTVDetail } from "@/lib/tmdb/types";

export const revalidate = 3600;

interface WatchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function queryValue(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export async function generateMetadata({ searchParams }: WatchPageProps): Promise<Metadata> {
  try {
    const query = await searchParams;
    const type = queryValue(query.type);
    const id = Number(queryValue(query.id));
    if ((type !== "movie" && type !== "tv") || !Number.isInteger(id) || id <= 0) {
      return { title: "Watch" };
    }
    const title =
      type === "movie" ? (await getMovie(id)).title : (await getTV(id)).name;
    return { title: `Watch ${title ?? ""}`.trim(), robots: { index: false } };
  } catch {
    return { title: "Watch" };
  }
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const query = await searchParams;
  const type = queryValue(query.type);
  const id = Number(queryValue(query.id));

  if ((type !== "movie" && type !== "tv") || !Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const detail =
    type === "movie" ? await getMovie(id).catch(() => null) : await getTV(id).catch(() => null);
  if (!detail) notFound();

  const movie = type === "movie" ? (detail as TMDbMovieDetail) : null;
  const tv = type === "tv" ? (detail as TMDbTVDetail) : null;

  const title = movie ? (movie.title ?? "Movie") : (tv?.name ?? "TV Show");
  const date = movie ? movie.release_date : tv?.first_air_date;
  const rating = detail.vote_average ?? 0;
  const year = yearFromDate(date ?? null);

  const season = Math.max(1, Number(queryValue(query.season)) || 1);
  const episode = Math.max(1, Number(queryValue(query.episode)) || 1);

  const seasons = tv?.seasons ?? [];
  const seasonExists = seasons.some((s) => s.season_number === season);
  const validSeason = type === "tv" && seasonExists ? season : 1;

  const initialEpisodes =
    type === "tv"
      ? (await getTVSeason(id, validSeason).catch(() => null))?.episodes ?? []
      : [];

  const sources = getEmbedSources({
    type,
    tmdbId: id,
    season: type === "tv" ? validSeason : undefined,
    episode: type === "tv" ? episode : undefined,
  });

  const backHref =
    type === "movie"
      ? `/movie/${id}`
      : `/tv/${id}`;

  const isAnime =
    (type === "movie"
      ? (await getMovieKeywords(id).catch(() => [] as number[]))
      : (await getTVKeywords(id).catch(() => [] as number[]))
    ).includes(ANIME_KEYWORD);

  const detailHref = isAnime ? `/anime/${type}/${id}` : backHref;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <WatchRecorder
        mediaType={type}
        tmdbId={id}
        title={title}
        posterPath={detail.poster_path ?? null}
        rating={detail.vote_average ?? undefined}
        season={type === "tv" ? validSeason : undefined}
        episode={type === "tv" ? episode : undefined}
      />
      <Link
        href={detailHref}
        className="inline-flex items-center gap-1.5 text-sm text-secondary transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to details
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-secondary">
          {[year, rating > 0 ? `${rating.toFixed(1)}★` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {type === "tv" && (
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
          S{String(validSeason).padStart(2, "0")} · E{String(episode).padStart(2, "0")}
        </p>
      )}

      <div className="mt-4">
        <VideoPlayer sources={sources} title={title} />
      </div>

      {type === "tv" && (
        <Suspense fallback={<EpisodeListSkeletonWithUrl count={5} />}>
          <EpisodeListWithUrl
            tvId={id}
            seasons={seasons}
            initialSeasonNumber={validSeason}
            initialEpisodes={initialEpisodes}
            activeEpisode={episode}
          />
        </Suspense>
      )}
    </div>
  );
}