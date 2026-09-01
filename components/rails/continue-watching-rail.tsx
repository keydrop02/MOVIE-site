"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLibrary } from "@/lib/storage/library-context";
import { LibraryCard } from "@/components/library/library-card";
import { cn } from "@/lib/utils";

export function ContinueWatchingRail() {
  const { history, progress, removeFromHistory } = useLibrary();
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
  }, [updateArrows]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".rail-card") as HTMLElement | null;
    const amount = card ? card.clientWidth + 16 : 320;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCard(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCard(1);
    }
  };

  const items = [...history].sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt));

  if (!items.length) return null;

  return (
    <section className={cn("py-5 sm:py-6")} aria-label="Continue Watching">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Continue Watching
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Scroll Continue Watching left"
              disabled={!canPrev}
              onClick={() => scrollByCard(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Scroll Continue Watching right"
              disabled={!canNext}
              onClick={() => scrollByCard(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Continue Watching rail"
          className="scrollbar-hidden -mt-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-2 outline-none"
        >
          {items.map((h) => {
            const key = `${h.mediaType}-${h.tmdbId}`;
            const prog = progress[key];
            const pct =
              prog && prog.duration > 0 ? Math.min(1, prog.progress / prog.duration) : undefined;
            return (
              <div
                key={key}
                className="rail-card w-[150px] flex-none snap-start sm:w-[170px] md:w-[180px] lg:w-[190px]"
              >
                <LibraryCard
                  item={h}
                  progress={pct}
                  lastWatchedAt={h.lastWatchedAt}
                  onRemove={() => removeFromHistory(h.mediaType, h.tmdbId)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
