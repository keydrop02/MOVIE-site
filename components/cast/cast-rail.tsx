"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TMDbPersonRole } from "@/lib/tmdb/types";
import { getTmdbImage } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils";

interface CastRailProps {
  cast: TMDbPersonRole[];
  title?: string;
  className?: string;
  max?: number;
}

export function CastRail({ cast, title = "Cast", className, max = 20 }: CastRailProps) {
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
  }, [updateArrows, cast]);

  if (!cast.length) return null;
  const items = cast.slice(0, max);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".cast-card") as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 120) + 20), behavior: "smooth" });
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
              aria-label="Scroll cast left"
              disabled={!canPrev}
              onClick={() => scroll(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Scroll cast right"
              disabled={!canNext}
              onClick={() => scroll(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="scrollbar-hidden flex overflow-x-auto pb-2"
        >
          {items.map((person) => {
            const avatar = getTmdbImage(person.profile_path, "profile", "w342");
            return (
              <div
                key={person.id}
                className="cast-card w-28 flex-none text-center sm:w-32"
              >
                <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-surface-elevated sm:h-28 sm:w-28">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={person.name ?? "Actor"}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-elevated">
                      <User className="h-8 w-8 text-muted/50" aria-hidden />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                  {person.name}
                </p>
                <p className="line-clamp-2 text-xs text-muted">{person.character}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CastRailSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-5 md:px-10">
      <div className="mb-3 h-7 w-24 rounded bg-white/[0.06] animate-pulse" />
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-28 flex-none text-center">
            <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-white/[0.06] sm:h-28 sm:w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
