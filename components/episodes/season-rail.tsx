"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { TMDbSeason } from "@/lib/tmdb/types";
import { getTmdbImage } from "@/lib/tmdb/images";
import { yearFromDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SeasonRailProps {
  tvId: number;
  seasons: TMDbSeason[];
  title?: string;
  className?: string;
}

export function SeasonRail({ tvId, seasons, title = "Seasons", className }: SeasonRailProps) {
  const cards = seasons.filter((s) => (s.season_number ?? 0) > 0 && (s.episode_count ?? 0) > 0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, cards.length]);

  if (!cards.length) return null;

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".season-card") as HTMLElement | null;
    const amount = card ? card.clientWidth + 16 : 320;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className={cn("py-5 sm:py-6", className)} aria-label={title}>
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Scroll seasons left"
              disabled={!canPrev}
              onClick={() => scrollByCard(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Scroll seasons right"
              disabled={!canNext}
              onClick={() => scrollByCard(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="scrollbar-hidden -mt-2 flex gap-4 overflow-x-auto pb-2 pl-2 pt-2"
        >
          {cards.map((season) => {
            const number = season.season_number ?? 0;
            const poster = getTmdbImage(season.poster_path, "poster", "w500");
            const name = season.name || `Season ${number}`;
            const year = yearFromDate(season.air_date ?? null);
            const episodeCount = season.episode_count ?? 0;
            return (
              <article
                key={season.id ?? number}
                className="season-card group relative w-72 flex-none sm:w-80"
              >
                <Link
                  href={`/watch?type=tv&id=${tvId}&season=${number}&episode=1`}
                  aria-label={`Play ${name}`}
                  className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                />
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 288px, 320px"
                      className="object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface">
                      <span className="text-xs text-muted">Season {number}</span>
                    </div>
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </span>
                  </span>
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {`Season ${number}`}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                    {episodeCount} ep
                  </span>
                </div>

                <div className="mt-2">
                  <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                    {name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {episodeCount === 1 ? "1 episode" : `${episodeCount} episodes`}
                    {year ? ` · ${year}` : ""}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SeasonRailSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-5 md:px-10">
      <div className="mb-4 h-7 w-32 animate-pulse rounded bg-white/[0.06]" />
      <div className="scrollbar-hidden flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-72 flex-none sm:w-80">
            <div className="aspect-video w-full animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="mt-2 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
