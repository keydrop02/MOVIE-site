"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { TMDbVideo } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

interface TrailerGridProps {
  videos: TMDbVideo[];
  title?: string;
  className?: string;
}

function youtubeThumb(key: string) {
  return `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;
}

export function TrailerGrid({ videos, title = "Trailers", className }: TrailerGridProps) {
  const [active, setActive] = useState<TMDbVideo | null>(null);
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
  }, [updateArrows, videos]);

  const filtered = videos.filter((v) => v.site === "YouTube" && v.key && v.type === "Trailer");

  if (!filtered.length) return null;

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".trailer-card") as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 16), behavior: "smooth" });
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
              aria-label="Scroll trailers left"
              disabled={!canPrev}
              onClick={() => scroll(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-secondary transition-colors hover:bg-white/[0.12] hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Scroll trailers right"
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
          className="scrollbar-hidden -mt-2 flex gap-4 overflow-x-auto pb-2 pt-2"
        >
          {filtered.map((video) => (
            <button
              key={video.id}
              type="button"
              onClick={() => setActive(video)}
              className="trailer-card group relative aspect-video w-[300px] flex-none overflow-hidden rounded-xl border border-white/[0.08] bg-surface-elevated text-left transition-transform duration-200 hover:scale-[1.01] sm:w-[340px]"
            >
              <Image
                src={youtubeThumb(video.key as string)}
                alt={video.name ?? "Video thumbnail"}
                fill
                sizes="(max-width: 640px) 100vw, 340px"
                className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/10">
                <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                  <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="line-clamp-1 text-sm font-medium text-white">{video.name}</p>
                <p className="text-xs text-white/70">{video.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active?.key && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.name ?? "Video player"}
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close video"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black/90"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${active.key}?autoplay=1`}
                title={active.name ?? "Video"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}