import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Play } from "lucide-react";
import { tmdbImage } from "@/lib/images";
import type { MediaDetails } from "@/lib/api/types";
import { formatRuntime } from "@/lib/utils";
import { withNamespace, type Namespace } from "@/lib/routes";
import { TrailerButton } from "./trailer-button";
import { CrewList } from "./crew-list";
import { PosterPlaceholder } from "./media-card";
import { WatchlistButton } from "./watchlist-button";
import { RatingBadge } from "./rating-badge";
import { ShareButton } from "./share-button";
import { siteConfig } from "@/lib/site";

export function DetailBanner({
  item,
  useAnimeRoutes = false,
}: {
  item: MediaDetails;
  useAnimeRoutes?: boolean;
}) {
  const ns: Namespace = useAnimeRoutes ? "anime" : "standard";
  const backdrop = tmdbImage(item.backdropPath ?? item.posterPath, "backdrop", "lg");
  const poster = tmdbImage(item.posterPath, "poster", "md");
  const runtime = formatRuntime(item.runtime);

  return (
    <section className="relative">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-card border border-border shadow-2xl sm:w-44 md:w-52">
            {poster ? (
              <Image src={poster} alt="" fill sizes="208px" className="object-cover" />
            ) : (
              <PosterPlaceholder />
            )}
          </div>

          <div className="min-w-0 max-w-3xl pb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {item.title}
              {item.year != null && (
                <span className="ml-2 font-mono text-xl font-medium text-muted sm:text-2xl">
                  ({item.year})
                </span>
              )}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs text-muted">
              <RatingBadge rating={item.rating} size="md" />
              {item.releaseDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5 text-faint" aria-hidden />
                  {formatRuntimeOrDate(item)}
                </span>
              )}
              {runtime && <span>{runtime}</span>}
              {item.numberOfSeasons != null && (
                <span>
                  {item.numberOfSeasons} season{item.numberOfSeasons === 1 ? "" : "s"}
                </span>
              )}
              {item.genres.slice(0, 4).map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${item.type}/${genre.id}`}
                  className="text-faint transition hover:text-foreground"
                >
                  {genre.name}
                </Link>
              ))}
              {isRecentlyAired(item) && (
                <span className="inline-flex items-center gap-1 text-xs text-gold">
                  <span className="size-1.5 rounded-full bg-gold" aria-hidden />
                  Recently Aired
                </span>
              )}
            </div>

            {item.overview && (
              <p className="mt-5 text-sm leading-relaxed text-zinc-300 sm:text-base">
                {item.overview}
              </p>
            )}

            {item.type === "movie" && (
              <div className="mt-5">
                <CrewList crew={item.crew} />
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={withNamespace(
                  item.type === "movie"
                    ? `/watch/movie/${item.tmdbId}`
                    : `/watch/tv/${item.tmdbId}/1/1`,
                  ns
                )}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <Play className="size-4 fill-current" aria-hidden />
                Watch Now
              </Link>
              <WatchlistButton
                item={{
                  tmdbId: item.tmdbId,
                  type: item.type,
                  title: item.title,
                  posterPath: item.posterPath,
                  backdropPath: item.backdropPath,
                  rating: item.rating,
                  year: item.year,
                }}
              />
              <TrailerButton
                videoKey={item.trailer?.key}
                watchHref={
                  item.type === "movie"
                    ? withNamespace(`/watch/movie/${item.tmdbId}?trailer=1`, ns)
                    : withNamespace(`/watch/tv/${item.tmdbId}/1/1?trailer=1`, ns)
                }
              />
              <ShareButton
                url={`${siteConfig.url}/${item.type}/${item.tmdbId}`}
                title={item.title}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatRuntimeOrDate(item: MediaDetails): string {
  if (item.releaseDate) return item.releaseDate;
  if (item.lastAirDate) return `Aired until ${item.lastAirDate}`;
  return String(item.year ?? "");
}

function isRecentlyAired(item: MediaDetails): boolean {
  if (item.type !== "tv" || !item.lastAirDate) return false;
  const diff = Date.now() - new Date(item.lastAirDate).getTime();
  return diff >= 0 && diff <= 72 * 60 * 60 * 1000;
}
