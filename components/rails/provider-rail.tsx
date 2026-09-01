"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTmdbImage } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils";

interface ProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

interface ProviderRailProps {
  title?: string;
  providers: ProviderItem[];
  className?: string;
}

export function ProviderRail({
  title = "Browse by Provider",
  providers,
  className,
}: ProviderRailProps) {
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
    const card = el.querySelector("a[href^='/provider/']") as HTMLElement | null;
    const amount = card ? card.clientWidth + 12 : 288;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!providers.length) return null;

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
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollByCard(-1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollByCard(1);
            }
          }}
          tabIndex={0}
          role="region"
          aria-label={`${title} rail`}
          className="scrollbar-hidden -mt-2 flex gap-3 overflow-x-auto pb-2 pt-2 outline-none"
        >
          {providers.map((provider) => {
            const logo = getTmdbImage(provider.logo_path, "logo", "w154");
            const href = `/provider/${provider.provider_id}`;
            return (
              <Link
                key={provider.provider_id}
                href={href}
                className="group flex flex-none flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-surface-elevated p-3 transition-colors hover:border-white/20 hover:bg-surface-hover"
                style={{ width: 128 }}
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-black">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={`${provider.provider_name} logo`}
                      width={64}
                      height={64}
                      className="object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="px-1 text-center text-[10px] leading-tight text-muted">
                      {provider.provider_name}
                    </span>
                  )}
                </div>
                <span className="line-clamp-1 text-center text-xs font-medium text-secondary group-hover:text-foreground">
                  {provider.provider_name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
