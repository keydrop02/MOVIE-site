"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Play, Clapperboard, Heart } from "lucide-react";
import type { Media } from "@/lib/tmdb/types";
import { posterUrl } from "@/lib/tmdb/images";
import { yearFromDate } from "@/lib/utils";
import { RatingBadge } from "@/components/media/rating-badge";
import { useLibrary } from "@/lib/storage/library-context";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: Media;
  progress?: number; // 0..1
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  imageSizes?: string;
  className?: string;
  showFavoriteOnHover?: boolean;
  priority?: boolean;
}

export function MediaCard({
  media,
  progress,
  isFavorite,
  onToggleFavorite,
  imageSizes = "(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 12vw",
  className,
  showFavoriteOnHover,
  priority,
}: MediaCardProps) {
  const router = useRouter();
  const { addToHistory } = useLibrary();
  const href = `/watch?type=${media.type}&id=${media.id}`;
  const src = posterUrl(media.posterPath);
  const year = yearFromDate(media.releaseDate);
  const typeLabel = media.type === "movie" ? "Movie" : "TV";
  const primaryGenre = media.genres.find((g) => g.name)?.name;
  const pct = typeof progress === "number" ? progress : 0;
  const showFav = showFavoriteOnHover && onToggleFavorite;

  return (
    <div className={cn("group relative", className)}>
      <Link
        href={href}
        className="block overflow-hidden rounded-xl border border-white/[0.08] bg-surface-elevated transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-black/50 group-hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-elevated">
          {src ? (
            <Image
              src={src}
              alt={`${media.title} poster`}
              sizes={imageSizes}
              fill
              className="object-cover"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-surface-elevated to-surface">
              <Clapperboard className="h-8 w-8 text-muted/40" aria-hidden />
            </div>
          )}

          {/* rating badge */}
          <RatingBadge
            rating={media.rating}
            className="absolute left-2 top-2"
          />

          {/* play on hover */}
          <button
            type="button"
            aria-label={`Play ${media.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToHistory(
                {
                  tmdbId: media.id,
                  mediaType: media.type,
                  title: media.title,
                  posterPath: media.posterPath,
                  rating: media.rating,
                },
                0,
                0
              );
              router.push(`/watch?type=${media.type}&id=${media.id}`);
            }}
            className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-lg backdrop-blur transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
          </button>

          {/* favorite indicator on hover */}
          {isFavorite && (
            <div className="absolute left-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur">
              <Heart className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
            </div>
          )}
        </div>
      </Link>

      {/* favorite toggle */}
      {showFav && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={!!isFavorite}
          className={cn(
            "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 backdrop-blur transition-all duration-200",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            isFavorite ? "opacity-100" : ""
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-accent text-accent" : "text-white"
            )}
            aria-hidden
          />
        </button>
      )}

      {/* progress bar */}
      {pct > 0 && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
          />
        </div>
      )}

      {/* metadata */}
      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">{media.title}</h3>
        <p className="line-clamp-1 text-xs text-muted">
          {[year, typeLabel, primaryGenre].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
