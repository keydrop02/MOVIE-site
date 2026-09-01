"use client";

import Image from "next/image";
import { getTmdbImage } from "@/lib/tmdb/images";
import type { Genre, TitleLogoInfo } from "@/lib/tmdb/types";
import { RatingBadge } from "@/components/media/rating-badge";
import { TitleLogo } from "@/components/media/title-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DetailHeroProps {
  backdrop: string | null | undefined;
  title: string;
  logo?: TitleLogoInfo | null;
  tagline?: string | null;
  meta: string;
  description?: string;
  rating: number;
  genres?: Genre[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Cinematic detail-page hero: full backdrop with gradient overlays,
 * editorial metadata, description and an action row supplied by parent.
 */
export function DetailHero({
  backdrop,
  title,
  logo,
  tagline,
  meta,
  description,
  rating,
  genres,
  actions,
  className,
}: DetailHeroProps) {
  const src = getTmdbImage(backdrop, "backdrop", "original");
  const genresList = (genres ?? []).filter((g) => g.name);

  return (
    <div className={cn("relative w-full overflow-hidden bg-cinema-gradient", className)}>
      {src ? (
        <div className="absolute inset-0">
          <Image
            src={src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            fetchPriority="high"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-cinema-gradient" />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-background) 0%, rgba(2,11,7,0.4) 40%, rgba(2,11,7,0.6) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(2,11,7,0.85) 0%, rgba(2,11,7,0.4) 50%, rgba(2,11,7,0) 75%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(60vh+50px)] w-full max-w-[1440px] items-end px-5 pb-2 pt-24 sm:min-h-[calc(64vh+50px)] md:px-10">
        <div className="w-full max-w-3xl">
          <TitleLogo logo={logo} title={title} />

          {tagline && (
            <p className="mt-1 text-base italic text-secondary">{tagline}</p>
          )}

          {meta && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
              <RatingBadge rating={rating} />
              <span className="text-foreground/60">{meta.split(" · ").join("   ·   ")}</span>
            </div>
          )}

          {genresList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {genresList.map((g) => (
                <Badge key={g.id}>{g.name}</Badge>
              ))}
            </div>
          )}

          {description && (
            <p className="mt-3 line-clamp-3 w-full max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
              {description}
            </p>
          )}

          {actions && (
            <div className="mt-5 flex w-full max-w-3xl flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DetailHeroSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-end bg-cinema-gradient px-5 pb-10 pt-24 md:px-10">
      <div className="w-full max-w-3xl space-y-4">
        <div className="h-10 w-3/4 animate-pulse rounded bg-white/[0.08] sm:h-16" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-4/5 max-w-md animate-pulse rounded bg-white/[0.06]" />
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-32 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="h-11 w-36 animate-pulse rounded-full bg-white/[0.08]" />
        </div>
      </div>
    </div>
  );
}
