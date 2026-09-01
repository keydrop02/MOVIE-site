"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Media } from "@/lib/tmdb/types";
import { MediaCard } from "@/components/media/media-card";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { cn } from "@/lib/utils";

interface MediaRailProps {
  title: string;
  items?: Media[];
  viewAllHref?: string;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (media: Media) => void;
  showFavoriteOnHover?: boolean;
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
}

/**
 * Reusable horizontal media rail with smooth snapping, hidden
 * scrollbar, previous/next arrows, and keyboard navigation.
 */
export function MediaRail({
  title,
  items = [],
  viewAllHref,
  isFavorite,
  onToggleFavorite,
  showFavoriteOnHover,
  loading,
  skeletonCount = 10,
  className,
}: MediaRailProps) {
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
    // scroll roughly one visible card + gap
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

  return (
    <section className={cn("py-5 sm:py-6", className)} aria-label={title}>
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              disabled={!canPrev}
              onClick={() => scrollByCard(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
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
          aria-label={`${title} rail`}
          className="scrollbar-hidden -mt-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-2 outline-none"
        >
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className="rail-card w-[150px] flex-none snap-start sm:w-[170px] md:w-[180px] lg:w-[190px]">
                  <MediaCardSkeleton />
                </div>
              ))
            : items.map((media) => (
                <div
                  key={`${media.type}-${media.id}`}
                  className="rail-card w-[150px] flex-none snap-start sm:w-[170px] md:w-[180px] lg:w-[190px]"
                >
                  <MediaCard
                    media={media}
                    isFavorite={isFavorite?.(`${media.type}-${media.id}`)}
                    onToggleFavorite={
                      onToggleFavorite ? () => onToggleFavorite(media) : undefined
                    }
                    showFavoriteOnHover={showFavoriteOnHover}
                    imageSizes="(max-width: 640px) 42vw, (max-width: 768px) 140px, (max-width: 1200px) 180px, 190px"
                  />
                </div>
              ))}
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="rail-view-all flex w-[150px] flex-none snap-start flex-col items-center justify-center gap-2 self-start aspect-[2/3] rounded-2xl border border-dashed border-white/20 text-secondary transition-colors hover:border-accent hover:text-accent sm:w-[170px] md:w-[180px] lg:w-[190px]"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
                <span className="text-sm font-medium">View all</span>
              </Link>
            )}
          </div>
        </div>
    </section>
  );
}
