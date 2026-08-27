import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Film, Play } from "lucide-react";
import { mediaImage } from "@/lib/images";
import type { MediaItem } from "@/lib/api/types";
import { withNamespace } from "@/lib/routes";
import { RatingBadge } from "./rating-badge";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<MediaItem["type"], string> = {
  movie: "Movie",
  tv: "Series",
};

export function PosterPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-surface",
        className
      )}
      aria-hidden
    >
      <Film className="size-8 text-faint" />
    </div>
  );
}

export function MediaCard({
  item,
  rank,
  priority = false,
  className,
  topRightAction,
  progress,
  seasonEpisode,
  newEpisode,
}: {
  item: MediaItem;
  rank?: number;
  priority?: boolean;
  className?: string;
  /** Small action (e.g. remove) pinned inside the poster's top-right corner. */
  topRightAction?: ReactNode;
  /** 0..1 playback progress for the progress bar. */
  progress?: number;
  /** Episode label, e.g. "S01 E04", shown instead of year. */
  seasonEpisode?: string;
  /** Show a small gold dot indicating a recently aired episode. */
  newEpisode?: boolean;
}) {
  const href = item.href ?? `/${item.type}/${item.tmdbId}`;
  // Callers can override the play target outright (e.g. history cards resume
  // the last-opened episode); otherwise it is derived from the TMDB ids and
  // tagged with the anime namespace when the detail link lives under /anime.
  const watchHref =
    item.watchHref ??
    withNamespace(
      item.type === "movie"
        ? `/watch/movie/${item.tmdbId}`
        : `/watch/tv/${item.tmdbId}/1/1`,
      item.href?.startsWith("/anime/") ? "anime" : "standard"
    );
  const poster = mediaImage(item.posterPath, "poster", "md");
  const label = `${item.title}${item.year ? ` (${item.year})` : ""}`;

  return (
    <div
      className={cn(
        "group relative block w-36 shrink-0 hover:z-20 focus-within:z-20 sm:w-40 md:w-44",
        className
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-card border border-border bg-card shadow-md transition duration-300 group-hover:-translate-y-1 group-hover:border-border-strong focus-within:outline-2 focus-within:-outline-offset-4 focus-within:outline-gold">
        <Link
          href={href}
          aria-label={label}
          className="absolute inset-0 focus-visible:outline-none"
        >
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 176px"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              priority={priority}
            />
          ) : (
            <PosterPlaceholder />
          )}

          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-background/80 via-background/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
          />
        </Link>

        <RatingBadge rating={item.rating} className="pointer-events-none absolute top-2 left-2 z-10" />

        {topRightAction && (
          <div className="absolute top-2 right-2 z-30">{topRightAction}</div>
        )}

        {rank != null && (
          <>
            <span
              aria-hidden
              className="rank-number pointer-events-none absolute -bottom-2 left-1.5 z-10 select-none text-7xl"
            >
              {rank}
            </span>
            <span className="sr-only">Ranked #{rank}</span>
          </>
        )}

        <Link
          href={watchHref}
          aria-label={`Play ${label}`}
          className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition duration-300 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:outline-none"
        >
          <span className="flex size-11 scale-75 items-center justify-center rounded-full bg-gold text-background shadow-xl transition-transform duration-300 group-hover:scale-100 group-focus-within:scale-100">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </span>
        </Link>

        {typeof progress === "number" && progress > 0 && (
          <span
            aria-hidden
            className="absolute bottom-0 left-0 z-10 h-0.5 rounded-full bg-gold"
            style={{ width: `${Math.min(progress, 1) * 100}%` }}
          />
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground transition">
          <Link href={href} className="focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        <p className="mt-0.5 font-mono text-xs text-muted">
          {seasonEpisode
            ? `${seasonEpisode} · ${TYPE_LABEL[item.type]}`
            : `${item.year ?? "—"} · ${TYPE_LABEL[item.type]}`}
          {newEpisode && (
            <span
              className="ml-1.5 inline-block size-1.5 rounded-full bg-gold align-middle"
              aria-label="Recently aired"
            />
          )}
        </p>
      </div>
    </div>
  );
}
