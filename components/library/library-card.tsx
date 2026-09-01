"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Clapperboard, Play } from "lucide-react";
import type { MediaRef } from "@/lib/storage/types";
import { getTmdbImage } from "@/lib/tmdb/images";
import { RatingBadge } from "@/components/media/rating-badge";
import { useLibrary } from "@/lib/storage/library-context";
import { cn, formatRelativeTime } from "@/lib/utils";

interface LibraryCardProps {
  item: MediaRef;
  progress?: number; // 0..1
  onRemove?: () => void;
  lastWatchedAt?: string;
  className?: string;
}

export function LibraryCard({
  item,
  progress,
  onRemove,
  lastWatchedAt,
  className,
}: LibraryCardProps) {
  const router = useRouter();
  const { addToHistory } = useLibrary();
  const src = getTmdbImage(item.posterPath, "poster", "w342");
  const historyItem = item as MediaRef & { season?: number; episode?: number };
  const href =
    historyItem.mediaType === "movie"
      ? `/watch?type=movie&id=${item.tmdbId}`
      : historyItem.season != null
        ? `/watch?type=tv&id=${item.tmdbId}&season=${historyItem.season}&episode=${
            historyItem.episode ?? 1
          }`
        : `/watch?type=tv&id=${item.tmdbId}`;
  const pct = progress !== undefined ? Math.round(progress * 100) : null;

  return (
    <div className={cn("group relative", className)}>
      <Link
        href={href}
        className="block overflow-hidden rounded-xl border border-white/[0.08] bg-surface-elevated transition-all duration-200 group-hover:scale-[1.03] group-hover:border-white/20 group-hover:shadow-xl group-hover:shadow-black/50"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-elevated">
          {src ? (
            <Image
              src={src}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 46vw, 170px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-surface-elevated to-surface">
              <Clapperboard className="h-8 w-8 text-muted/40" aria-hidden />
            </div>
          )}

          {item.rating != null && (
            <RatingBadge rating={item.rating} className="absolute left-2 top-2" />
          )}

          <button
            type="button"
            aria-label={`Play ${item.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToHistory(
                {
                  tmdbId: item.tmdbId,
                  mediaType: item.mediaType,
                  title: item.title,
                  posterPath: item.posterPath,
                  rating: item.rating,
                },
                0,
                0
              );
              router.push(href);
            }}
            className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-lg backdrop-blur transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
          </button>
        </div>
      </Link>

      {pct !== null && pct > 0 && (
        <div
          className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% watched`}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</h3>
        <p className="line-clamp-1 text-xs text-muted">
          {(() => {
            const historyItem = item as MediaRef & { season?: number; episode?: number };
            const time = lastWatchedAt ? formatRelativeTime(lastWatchedAt) : null;
            if (historyItem.mediaType === "movie") return time ?? "Movie";
            if (historyItem.season != null) {
              const seasonEp = `S${String(historyItem.season).padStart(2, "0")}·E${
                historyItem.episode != null
                  ? String(historyItem.episode).padStart(2, "0")
                  : "01"
              }`;
              return time ? `${seasonEp} ·  ${time}` : seasonEp;
            }
            return time ?? "TV";
          })()}
        </p>
      </div>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${item.title}`}
          onClick={onRemove}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-red-600 hover:text-white focus-visible:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
