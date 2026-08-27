"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Play, Star } from "lucide-react";
import type { MediaItem } from "@/lib/api/types";
import { tmdbImage } from "@/lib/images";
import { cn, truncate } from "@/lib/utils";
import { PosterPlaceholder } from "./media-card";

const ROTATE_MS = 7000;
const SLIDE_COUNT = 6;

type GenreMap = Record<number, string>;

export function Hero({
  items,
  genreMap,
}: {
  items: MediaItem[];
  genreMap: GenreMap;
}) {
  const slides = items.slice(0, SLIDE_COUNT);
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  const goTo = useCallback((next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      if (!pausedRef.current) {
        setIndex((current) => (current + 1) % slides.length);
      }
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const active = slides[index];
  const genres =
    active.genreIds
      ?.map((id) => genreMap[id])
      .filter(Boolean)
      .slice(0, 3)
      .join(" · ") ?? undefined;
  const watchHref =
    active.type === "movie"
      ? `/watch/movie/${active.tmdbId}`
      : `/watch/tv/${active.tmdbId}/1/1`;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      className="relative flex min-h-[72vh] items-end overflow-hidden bg-card md:min-h-[78vh]"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
    >
      {/* Backdrops */}
      <div aria-hidden className="absolute inset-0">
        {slides.map((slide, i) => {
          const image = tmdbImage(slide.backdropPath ?? slide.posterPath, "backdrop", "lg");
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                i === index ? "opacity-100" : "opacity-0"
              )}
            >
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover object-top"
                />
              ) : (
                <PosterPlaceholder />
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/20" />
      </div>

      {/* Content */}
      <div
        key={active.id}
        className="animate-fade-up relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {active.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-muted">
          {active.rating != null && (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Star className="size-4 fill-gold text-gold" aria-hidden />
              {active.rating.toFixed(1)}
            </span>
          )}
          {active.year != null && <span>{active.year}</span>}
          {genres && <span>{genres}</span>}
        </div>

        {active.overview && (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            {truncate(active.overview, 240)}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={watchHref}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Play className="size-4 fill-current" aria-hidden />
            Watch Now
          </Link>
          <Link
            href={`/${active.type}/${active.tmdbId}`}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong bg-card/70 px-5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-border-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Info className="size-4" aria-hidden />
            More Info
          </Link>
        </div>

        {/* Indicators */}
        {slides.length > 1 && (
          <div className="mt-8 flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}: ${slide.title}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
                  i === index ? "w-8 bg-gold" : "w-3 bg-white/25 hover:bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
