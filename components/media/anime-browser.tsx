"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Genre, Media } from "@/lib/tmdb/types";
import { DiscoverBrowser } from "@/components/media/discover-browser";
import { FilterBar, type Filters } from "@/components/filters/filter-bar";
import { MediaGrid, MediaGridSkeleton } from "@/components/media/media-grid";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type Tab = "all" | "movie" | "tv";

interface AnimeBrowserProps {
  animeKeyword: number;
  movieGenres: Genre[];
  tvGenres: Genre[];
  initialFilters?: Filters;
  movieInitial: Media[];
  movieInitialTotalPages: number;
  tvInitial: Media[];
  tvInitialTotalPages: number;
}

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
];

function buildQuery(filters: Filters, page: number, keywords: number) {
  const p = new URLSearchParams();
  p.set("page", String(page));
  if (filters.genre) p.set("genre", String(filters.genre));
  if (filters.year) p.set("year", String(filters.year));
  if (filters.rating) p.set("rating", String(filters.rating));
  if (filters.country) p.set("country", filters.country);
  if (filters.language) p.set("language", filters.language);
  if (filters.sort) p.set("sort", filters.sort);
  p.set("keywords", String(keywords));
  return p.toString();
}

function mergeMedia(a: Media[], b: Media[]): Media[] {
  const seen = new Set<string>();
  const out: Media[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    for (const arr of [a, b]) {
      const item = arr[i];
      if (!item) continue;
      const animeItem = { ...item, isAnime: true };
      const key = `${item.type}-${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(animeItem);
      }
    }
  }
  return out;
}

function unionGenres(a: Genre[], b: Genre[]): Genre[] {
  const seen = new Set<number>();
  const out: Genre[] = [];
  for (const g of [...a, ...b]) {
    if (!seen.has(g.id)) {
      seen.add(g.id);
      out.push(g);
    }
  }
  return out;
}

export function AnimeBrowser({
  animeKeyword,
  movieGenres,
  tvGenres,
  initialFilters,
  movieInitial,
  movieInitialTotalPages,
  tvInitial,
  tvInitialTotalPages,
}: AnimeBrowserProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [filters, setFilters] = useState<Filters>(initialFilters ?? {});
  const [items, setItems] = useState<Media[]>(() =>
    mergeMedia(movieInitial, tvInitial)
  );
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    Math.max(movieInitialTotalPages, tvInitialTotalPages)
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const loadPage = useCallback(
    async (nextMovie: number, nextTv: number) => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      setLoading(true);
      try {
        const [mRes, tRes] = await Promise.all([
          fetch(`/api/movies?${buildQuery(filters, nextMovie, animeKeyword)}`),
          fetch(`/api/tv?${buildQuery(filters, nextTv, animeKeyword)}`),
        ]);
        if (!mRes.ok || !tRes.ok) throw new Error("failed");
        const mData = (await mRes.json()) as { results: Media[]; totalPages: number };
        const tData = (await tRes.json()) as { results: Media[]; totalPages: number };
        const fresh = mergeMedia(mData.results ?? [], tData.results ?? []);
        setItems((prev) => {
          const seen = new Set(prev.map((m) => `${m.type}-${m.id}`));
          return [...prev, ...fresh.filter((m) => !seen.has(`${m.type}-${m.id}`))];
        });
        setMoviePage(nextMovie);
        setTvPage(nextTv);
        setTotalPages(Math.max(mData.totalPages, tData.totalPages));
      } catch {
        setError("Something went wrong loading more results. Try again.");
      } finally {
        inflightRef.current = false;
        setLoading(false);
      }
    },
    [filters, animeKeyword]
  );

  const applyFilters = useCallback(
    async (next: Filters) => {
      setFilters(next);
      setInitialLoading(true);
      setError(null);
      try {
        const [mRes, tRes] = await Promise.all([
          fetch(`/api/movies?${buildQuery(next, 1, animeKeyword)}`),
          fetch(`/api/tv?${buildQuery(next, 1, animeKeyword)}`),
        ]);
        if (!mRes.ok || !tRes.ok) throw new Error("failed");
        const mData = (await mRes.json()) as { results: Media[]; totalPages: number };
        const tData = (await tRes.json()) as { results: Media[]; totalPages: number };
        setItems(mergeMedia(mData.results ?? [], tData.results ?? []));
        setMoviePage(1);
        setTvPage(1);
        setTotalPages(Math.max(mData.totalPages, tData.totalPages));
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setInitialLoading(false);
      }
    },
    [animeKeyword]
  );

  useEffect(() => {
    inflightRef.current = false;
  }, [tab]);

  const allGenres = unionGenres(movieGenres, tvGenres);

  const tabList = (
    <div
      role="tablist"
      aria-label="Anime type"
      className="flex w-full items-center gap-1 rounded-full border border-white/10 bg-surface-elevated p-1 sm:w-64"
    >
      {TABS.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={tab === t.value}
          onClick={() => setTab(t.value)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors focus:outline-none",
            tab === t.value
              ? "bg-accent font-semibold text-accent-foreground"
              : "text-secondary hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const renderFilterRow = (fb: React.ReactNode) => (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="w-full flex-none sm:w-64">{tabList}</div>
      <div className="min-w-0 flex-1">{fb}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      {tab !== "all" ? (
        <DiscoverBrowser
          key={tab}
          type={tab}
          genres={tab === "movie" ? movieGenres : tvGenres}
          keywords={[animeKeyword]}
          isAnime
          initialFilters={filters}
          initial={tab === "movie" ? movieInitial : tvInitial}
          initialTotalPages={tab === "movie" ? movieInitialTotalPages : tvInitialTotalPages}
          hideCountry
          hideLanguage
          renderFilter={({ filters, onChange, onReset, genres }) =>
            renderFilterRow(
              <FilterBar
                genres={genres}
                filters={filters}
                onChange={onChange}
                onReset={onReset}
                hideCountry
                hideLanguage
              />
            )
          }
        />
      ) : (
        <>
          {renderFilterRow(
            <FilterBar
              genres={allGenres}
              filters={filters}
              onChange={applyFilters}
              onReset={() => applyFilters({})}
              hideCountry
              hideLanguage
            />
          )}

          {error && !items.length ? (
            <ErrorState />
          ) : initialLoading ? (
            <MediaGridSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title="No results"
              description="Try adjusting your filters to find more."
            />
          ) : (
            <>
              <MediaGrid items={items} />
              <div className="flex flex-col items-center gap-3 py-6">
                {error && items.length > 0 && (
                  <p className="text-sm text-foreground">{error}</p>
                )}
                {(moviePage < totalPages || tvPage < totalPages) && !initialLoading ? (
                  <button
                    type="button"
                    onClick={() => loadPage(moviePage + 1, tvPage + 1)}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-surface-elevated px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {loading ? "Loading..." : "Load More"}
                  </button>
                ) : (
                  items.length > 0 && (
                    <p className="text-sm text-muted">You&apos;ve reached the end.</p>
                  )
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
