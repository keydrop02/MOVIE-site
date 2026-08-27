"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { MediaItem } from "@/lib/api/types";
import type { AllMediaResults } from "@/lib/api/search";
import { GridSkeleton } from "./loading-skeleton";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import { MediaCard } from "./media-card";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 400;

type TypeFilter = "all" | "movie" | "tv";

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
];

const FILTER_LABEL: Record<TypeFilter, string> = {
  all: "All",
  movie: "Movies",
  tv: "TV Shows",
};

type SortMode = "popular" | "rating" | "newest";

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Newest" },
];

const byPopularity = (a: MediaItem, b: MediaItem) =>
  (b.popularity ?? 0) - (a.popularity ?? 0);

/**
 * Appends an already popularity-ranked batch after the existing rows WITHOUT
 * re-sorting the whole list — re-sorting would reshuffle cards above the
 * viewport and make the page appear to jump when loading more.
 */
function appendBatch(existing: MediaItem[], batch: MediaItem[]): MediaItem[] {
  const seen = new Set(existing.map((item) => item.id));
  return [...existing, ...batch.filter((item) => !seen.has(item.id))];
}

function TypeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-4 text-xs font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold",
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-border bg-card text-muted hover:border-gold/50 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function SearchExperience({
  initialQuery,
  initialResults,
}: {
  initialQuery: string;
  initialResults: AllMediaResults;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<MediaItem[]>(
    initialQuery ? initialResults.items : []
  );
  const [sections, setSections] = useState<AllMediaResults["sections"]>(
    initialQuery ? initialResults.sections : { movie: { page: 1, totalPages: 0 }, tv: { page: 1, totalPages: 0 } }
  );
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Full refresh of the combined list (first lookup and manual retries).
  const fetchAll = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?type=all&q=${encodeURIComponent(q)}`
      , { signal: controller.signal });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as AllMediaResults;
      if (controller !== abortRef.current) return;
      // Fresh search: full popularity ranking is the baseline order.
      setItems([...data.items].sort(byPopularity));
      setSections(data.sections);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Search is unavailable right now. Please try again.");
    } finally {
      if (controller === abortRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!touched) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timer = setTimeout(() => {
      void fetchAll(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, touched, fetchAll]);

  /** Loads the next page of every stream that still has pages to give. */
  async function loadMore() {
    const trimmed = query.trim();
    const streams =
      filter === "all"
        ? (["movie", "tv"] as const).filter(
            (kind) => sections[kind].page < sections[kind].totalPages
          )
        : sections[filter].page < sections[filter].totalPages
          ? ([filter] as const)
          : [];
    if (!trimmed || streams.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingMore(true);
    setLoadFailed(false);

    try {
      const pages = await Promise.all(
        streams.map(async (kind) => {
          const params = new URLSearchParams({
            q: trimmed,
            type: kind,
            page: String(sections[kind].page + 1),
          });
          const response = await fetch(`/api/search?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(String(response.status));
          return {
            kind,
            data: (await response.json()) as { items: MediaItem[]; page: number; totalPages: number },
          };
        })
      );
      if (controller !== abortRef.current) return;

      // Rank the new batch among itself, then strictly append — the rows
      // above the viewport never move, so the scroll position holds.
      const batch = pages
        .flatMap(({ data }) => data.items)
        .sort(byPopularity);
      setItems((current) => appendBatch(current, batch));
      setSections((current) => {
        const next = { ...current };
        for (const { kind, data } of pages) {
          next[kind] = { page: data.page, totalPages: data.totalPages };
        }
        return next;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (controller !== abortRef.current) return;
      setLoadFailed(true);
    } finally {
      if (controller === abortRef.current) setLoadingMore(false);
    }
  }

  const hasMore =
    filter === "all"
      ? sections.movie.page < sections.movie.totalPages ||
        sections.tv.page < sections.tv.totalPages
      : sections[filter].page < sections[filter].totalPages;

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const filtered =
    filter === "all" ? items : items.filter((item) => item.type === filter);
  const visible = [...filtered].sort((a, b) => {
    if (sortMode === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortMode === "newest") return (b.year ?? 0) - (a.year ?? 0);
    return byPopularity(a, b);
  });

  return (
    <div className="space-y-10">
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="mx-auto max-w-3xl"
      >
        <div className="flex items-center gap-3">
          <label htmlFor="search-input" className="sr-only">
            Search movies and TV shows
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-faint"
              aria-hidden
            />
            <input
              id="search-input"
              type="search"
              value={query}
              onChange={(event) => {
                setTouched(true);
                setQuery(event.target.value);
              }}
              placeholder="Search movies & shows…"
              autoComplete="off"
              autoFocus={!initialQuery}
              maxLength={100}
              className="w-full rounded-full border border-border bg-card py-3.5 pr-12 pl-12 text-base text-foreground placeholder:text-faint transition focus:border-gold focus:bg-surface focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setTouched(true);
                  setQuery("");
                }}
                aria-label="Clear search"
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-faint transition hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Type filter tabs sit above the results header */}
      {hasQuery && !loading && !error && (
        <>
          <div role="group" aria-label="Filter results by type" className="-mt-4 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((option) => (
              <TypeTab
                key={option.value}
                active={filter === option.value}
                label={option.label}
                onClick={() => setFilter(option.value)}
              />
            ))}
          </div>
          <div role="group" aria-label="Sort results" className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <TypeTab
                key={option.value}
                active={sortMode === option.value}
                label={option.label}
                onClick={() => setSortMode(option.value)}
              />
            ))}
          </div>
        </>
      )}

      {error && (
        <ErrorState
          title="Search failed"
          message={error}
          action={
            <button
              type="button"
              onClick={() => void fetchAll(query.trim())}
              className="rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
            >
              Try again
            </button>
          }
        />
      )}

      {!hasQuery && !error && (
        <EmptyState
          icon={Search}
          title="Find something to watch"
          message="Start typing to search across thousands of movies and TV shows."
        />
      )}

      {hasQuery && !loading && !error && visible.length === 0 && (
        <EmptyState
          title={`No ${FILTER_LABEL[filter].toLowerCase()} results for "${query.trim()}"`}
          message="Check the spelling or try a different keyword."
        />
      )}

      {hasQuery && loading && <GridSkeleton count={12} />}

      {hasQuery && !loading && !error && visible.length > 0 && (
        <section aria-label="Search results">
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {visible.map((item) => (
              <MediaCard key={item.id} item={item} className="w-full" />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-card/70 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : loadFailed ? "Retry" : "Load more"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
