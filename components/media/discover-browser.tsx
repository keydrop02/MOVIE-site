"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Genre, Media, MediaType } from "@/lib/tmdb/types";
import { FilterBar, type Filters } from "@/components/filters/filter-bar";
import { MediaGrid, MediaGridSkeleton } from "@/components/media/media-grid";
import { EmptyState, ErrorState } from "@/components/ui/states";

interface DiscoverBrowserProps {
  type: MediaType;
  genres: Genre[];
  keywords?: number[];
  isAnime?: boolean;
  initialFilters?: Filters;
  initial: Media[];
  initialTotalPages: number;
  hideCountry?: boolean;
  hideLanguage?: boolean;
  renderFilter?: (props: {
    filters: Filters;
    onChange: (f: Filters) => void;
    onReset: () => void;
    genres: Genre[];
  }) => React.ReactNode;
}

function buildQuery(filters: Filters, page: number, keywords?: number[]) {
  const p = new URLSearchParams();
  p.set("page", String(page));
  if (filters.genre) p.set("genre", String(filters.genre));
  if (filters.year) p.set("year", String(filters.year));
  if (filters.rating) p.set("rating", String(filters.rating));
  if (filters.country) p.set("country", filters.country);
  if (filters.language) p.set("language", filters.language);
  if (filters.sort) p.set("sort", filters.sort);
  if (keywords?.length) p.set("keywords", keywords.join(","));
  return p.toString();
}

export function DiscoverBrowser({
  type,
  genres,
  keywords,
  isAnime = false,
  initialFilters,
  initial,
  initialTotalPages,
  hideCountry,
  hideLanguage,
  renderFilter,
}: DiscoverBrowserProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters ?? {});
  const [items, setItems] = useState<Media[]>(() =>
    isAnime ? initial.map((m) => ({ ...m, isAnime: true })) : initial
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const apiPath = type === "movie" ? "movies" : "tv";

  const loadMore = useCallback(async () => {
    if (inflightRef.current || loading || page >= totalPages) return;
    inflightRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/${apiPath}?${buildQuery(filters, page + 1, keywords)}`);
      if (!res.ok) throw new Error("Failed to load more");
      const data = (await res.json()) as { results: Media[]; totalPages: number };
      setItems((prev) => {
        const seen = new Set(prev.map((m) => `${m.type}-${m.id}`));
        const stamped = (data.results ?? []).map((m) => (isAnime ? { ...m, isAnime: true } : m));
        const fresh = stamped.filter((m) => !seen.has(`${m.type}-${m.id}`));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
      setTotalPages(data.totalPages);
      setPage((p) => p + 1);
    } catch {
      setError("Something went wrong loading more results. Try again.");
    } finally {
      inflightRef.current = false;
      setLoading(false);
    }
  }, [loading, page, totalPages, filters, apiPath, keywords, isAnime]);

  const applyFilters = useCallback(
    async (next: Filters) => {
      setFilters(next);
      setInitialLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/${apiPath}?${buildQuery(next, 1, keywords)}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { results: Media[]; totalPages: number };
        setItems(
          isAnime ? (data.results ?? []).map((m) => ({ ...m, isAnime: true })) : data.results
        );
        setTotalPages(data.totalPages);
        setPage(1);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setInitialLoading(false);
      }
      // intent-coded skip
    },
    [apiPath, keywords, isAnime]
  );

  return (
    <div className="space-y-5">
      {renderFilter ? (
        renderFilter({ filters, onChange: applyFilters, onReset: () => applyFilters({}), genres })
      ) : (
        <FilterBar
          genres={genres}
          filters={filters}
          onChange={applyFilters}
          onReset={() => applyFilters({})}
          hideCountry={hideCountry}
          hideLanguage={hideLanguage}
        />
      )}

      {error && !items.length ? (
        <ErrorState />
      ) : initialLoading ? (
        <MediaGridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState title="No results" description="Try adjusting your filters to find more." />
      ) : (
        <>
          <MediaGrid items={items} />
          <div className="flex flex-col items-center gap-3 py-6">
            {error && items.length > 0 && (
              <p className="text-sm text-foreground">{error}</p>
            )}
            {page < totalPages ? (
              <button
                type="button"
                onClick={loadMore}
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
    </div>
  );
}
