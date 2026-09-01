"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Search,
} from "lucide-react";
import type { TMDbEpisode, TMDbSeason } from "@/lib/tmdb/types";
import { getTmdbImage } from "@/lib/tmdb/images";
import { formatRuntime, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Popover, PopoverItem } from "@/components/ui/popover";

type SortMode = "oldest" | "newest";

interface EpisodeListProps {
  tvId: number;
  seasons: TMDbSeason[];
  initialSeasonNumber: number;
  initialEpisodes: TMDbEpisode[];
  activeEpisode?: number;
  onSeasonChange?: (seasonNumber: number, episodeNumber: number) => void;
  containerClassName?: string;
}

export function EpisodeList({
  tvId,
  seasons,
  initialSeasonNumber,
  initialEpisodes,
  activeEpisode,
  onSeasonChange,
  containerClassName,
}: EpisodeListProps) {
  const [seasonNumber, setSeasonNumber] = useState(initialSeasonNumber);
  const [activeEp, setActiveEp] = useState<number | undefined>(activeEpisode);
  const [episodes, setEpisodes] = useState<TMDbEpisode[]>(initialEpisodes);
  const [sort, setSort] = useState<SortMode>("oldest");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetOnLoad, setResetOnLoad] = useState(false);
  const resetOnLoadRef = useRef(false);
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
    const el = scrollerRef.current;
    if (el) updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  useEffect(() => {
    updateArrows();
  }, [updateArrows, episodes, loading]);

  useEffect(() => {
    setActiveEp(activeEpisode);
  }, [activeEpisode]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // roughly one visible card + gap
    const card = el.querySelector(".episode-card") as HTMLElement | null;
    const amount = card ? card.clientWidth + 16 : 320;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    const shouldLoad = seasonNumber !== initialSeasonNumber || episodes.length === 0;
    if (!shouldLoad) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/tv/${tvId}/season/${seasonNumber}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { episodes: TMDbEpisode[] };
        if (cancelled) return;
        const list = data.episodes || [];
        setEpisodes(list);
        if (resetOnLoadRef.current && list.length) {
          const first = [...list].sort((a, b) =>
            sort === "newest"
              ? (b.episode_number ?? 0) - (a.episode_number ?? 0)
              : (a.episode_number ?? 0) - (b.episode_number ?? 0)
          )[0];
          resetOnLoadRef.current = false;
          setResetOnLoad(false);
          if (first.episode_number != null) {
            setActiveEp(first.episode_number);
            onSeasonChange?.(seasonNumber, first.episode_number);
          }
        }
      } catch {
        /* keep previous */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvId, seasonNumber]);

  const sorted = useMemo(() => {
    const list = [...episodes];
    if (sort === "newest") list.sort((a, b) => (b.episode_number ?? 0) - (a.episode_number ?? 0));
    else list.sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));
    return list;
  }, [episodes, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        String(e.episode_number).includes(q) ||
        e.overview?.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  if (!seasons.length) return null;
  const currentSeason = seasons.find((s) => s.season_number === seasonNumber);

  return (
    <section className="py-5 sm:py-6" aria-label="Episodes">
      <div className={containerClassName ?? "mx-auto w-full max-w-[1440px] px-5 md:px-15"}>
        <div className="mb-2 flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Episodes
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Popover
              align="start"
              label="Select season"
              contentClassName="scrollbar-thin max-h-72 min-w-[220px] overflow-y-auto"
              trigger={
                <button
                  type="button"
                  aria-label="Select season"
                  className="flex h-9 items-center gap-2 rounded-full border border-white/15 bg-surface-elevated px-3 text-sm text-foreground transition-colors hover:border-white/25 focus:outline-none"
                >
                  <span className="truncate">
                    {currentSeason?.name || `Season ${seasonNumber}`}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-none text-muted" aria-hidden />
                </button>
              }
            >
              {seasons.map((s) => (
                <PopoverItem
                  key={s.season_number}
                  active={s.season_number === seasonNumber}
                  onClick={() => {
                    setSeasonNumber(s.season_number ?? 0);
                    resetOnLoadRef.current = true;
                    setResetOnLoad(true);
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{s.name || `Season ${s.season_number}`}</span>
                    {s.season_number === seasonNumber && (
                      <Check className="h-4 w-4 flex-none text-accent" aria-hidden />
                    )}
                  </span>
                </PopoverItem>
              ))}
            </Popover>

            <button
              type="button"
              onClick={() => setSort(sort === "oldest" ? "newest" : "oldest")}
              aria-label={`Sort episodes ${sort === "oldest" ? "newest first" : "oldest first"}`}
              title={`Sort episodes ${sort === "oldest" ? "newest first" : "oldest first"}`}
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-surface-elevated px-3 text-sm text-secondary transition-colors hover:text-foreground focus:outline-none"
            >
              {sort === "oldest" ? "Oldest" : "Newest"}
              <ArrowUpDown className="h-4 w-4" aria-hidden />
            </button>

            <label className="relative block w-full max-w-60">
              <span className="sr-only">Find an episode</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find an episode…"
                autoComplete="off"
                maxLength={100}
                className="h-9 w-full rounded-full bg-surface-elevated pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
            </label>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                aria-label="Scroll episodes left"
                disabled={!canPrev}
                onClick={() => scrollByCard(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-surface-elevated text-secondary transition-colors hover:border-white/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Scroll episodes right"
                disabled={!canNext}
                onClick={() => scrollByCard(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-surface-elevated text-secondary transition-colors hover:border-white/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" aria-label="Loading episodes" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center text-sm text-muted">
            No episodes match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <div
            ref={scrollerRef}
            onScroll={updateArrows}
className="scrollbar-hidden -mt-2 flex gap-4 overflow-x-auto pb-2 pl-2 pt-4"
          >
            {filtered.map((episode) => {
              const still = getTmdbImage(episode.still_path, "still", "w300");
              const runtime = formatRuntime(episode.runtime);
              const released =
                !episode.air_date || new Date(`${episode.air_date}T00:00:00`) <= new Date();
              return (
                <article
                  key={episode.id}
                  aria-current={episode.episode_number === activeEp ? "true" : undefined}
                  className={cn(
                    "episode-card group relative w-72 flex-none sm:w-80",
                    episode.episode_number === activeEp && "opacity-100 z-40"
                  )}
                >
                  <Link
                    href={`/watch?type=tv&id=${tvId}&season=${seasonNumber}&episode=${episode.episode_number}`}
                    aria-label={`Play episode ${episode.episode_number}: ${episode.name ?? "Untitled"}`}
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  />
                  <div
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-xl bg-surface",
                      episode.episode_number === activeEp && "ring-2 ring-accent z-50"
                    )}
                  >
                    {still ? (
                      <Image
                        src={still}
                        alt={episode.name ?? `Episode ${episode.episode_number}`}
                        fill
                        sizes="(max-width: 640px) 288px, 320px"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface">
                        <span className="text-xs text-muted">
                          Ep {episode.episode_number}
                        </span>
                      </div>
                    )}
                    {episode.episode_number === activeEp && (
                      <span className="absolute right-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                        Now playing
                      </span>
                    )}
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
                      {`E${String(episode.episode_number ?? 0).padStart(2, "0")}`}
                    </span>
                    {released && runtime ? (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                        {runtime}
                      </span>
                    ) : !released && episode.air_date ? (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                        {formatDate(episode.air_date)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2">
                    <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                      {episode.name || "Untitled"}
                    </h3>
                    {episode.overview && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {episode.overview}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {currentSeason && !currentSeason.name?.toLowerCase().startsWith("specials") && (
          <p className="mt-3 text-xs text-muted">
            Season {seasonNumber} · {episodes.length} episodes
          </p>
        )}
      </div>
    </section>
  );
}

export function EpisodeListSkeleton({ count = 6 }: { count?: number }) {
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
