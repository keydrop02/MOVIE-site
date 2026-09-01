"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info } from "lucide-react";
import type { Media } from "@/lib/tmdb/types";
import { getTmdbImage } from "@/lib/tmdb/images";
import { yearFromDate } from "@/lib/utils";
import { RatingBadge } from "@/components/media/rating-badge";
import { TitleLogo } from "@/components/media/title-logo";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  items: Media[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

/**
 * Cinematic hero carousel. Renders the backdrop full-bleed with
 * multiple gradient layers, editorial metadata and actions on the
 * lower-left, plus autoplay (pausing on hover/focus/interaction).
 */
export function HeroCarousel({
  items,
  autoPlay = true,
  autoPlayInterval = 6000,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = items.length;
  const current = items[index];

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  const play = useCallback(() => setPaused(false), []);
  const pause = useCallback(() => setPaused(true), []);

  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return;
    timerRef.current = setTimeout(() => {
      go(1);
    }, autoPlayInterval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoPlay, paused, count, go, autoPlayInterval, index]);

  if (count === 0) return null;
  const backdrop = getTmdbImage(current.backdropPath, "backdrop", "w1280");
  const year = yearFromDate(current.releaseDate);
  const genreLine = current.genres
    .filter((g) => g.name)
    .map((g) => g.name)
    .join(" · ");

  const href = current.isAnime
    ? `/anime/${current.type}/${current.id}`
    : current.type === "movie"
      ? `/movie/${current.id}`
      : `/tv/${current.id}`;
  const watchHref = `/watch?type=${current.type}&id=${current.id}`;

  return (
    <div
      className="relative h-[60vh] w-full overflow-hidden sm:h-[70vh] lg:h-[85vh]"
      onMouseEnter={pause}
      onMouseLeave={play}
      onFocus={pause}
      onBlur={play}
    >
      {/* Backdrop */}
      {backdrop ? (
        <div className="absolute inset-0">
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            fetchPriority="high"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-cinema-gradient" />
      )}

      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-background) 0%, rgba(2,11,7,0) 22%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(2,11,7,0.82) 0%, rgba(2,11,7,0.5) 35%, rgba(2,11,7,0) 65%)",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="pointer-events-none relative z-10 flex h-full items-end">
        <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 md:px-10">
          <div className="max-w-2xl">
            <TitleLogo logo={current.logo} title={current.title} />

            {(current.rating > 0 || year || genreLine) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
                <RatingBadge rating={current.rating} />
                {year && <span className="text-foreground/60">{year}</span>}
                {genreLine && <span className="truncate text-foreground/60">{genreLine}</span>}
              </div>
            )}

            {current.overview && (
              <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
                {current.overview}
              </p>
            )}

            <div className="pointer-events-auto mt-5 flex items-center gap-3">
              <Link
                href={watchHref}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-white/85"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden />
                Play
              </Link>
              <Link
                href={href}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-white/[0.14]"
              >
                <Info className="h-4 w-4" aria-hidden />
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom indicators */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2 px-5 md:bottom-16 md:justify-end md:px-10">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to slide ${i + 1}: ${item.title}`}
            aria-current={i === index}
            onClick={() => {
              pause();
              setIndex(i);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}
