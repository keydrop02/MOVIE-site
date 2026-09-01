"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import type { Media } from "@/lib/tmdb/types";
import { MediaGrid, MediaGridSkeleton } from "@/components/media/media-grid";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type ResultType = "all" | "movie" | "tv" | "anime";

interface SearchResultsProps {
  initialQuery?: string;
  initialType?: ResultType;
}

function buildQuery(query: string, type: string, page: number) {
  const p = new URLSearchParams();
  p.set("query", query);
  p.set("type", type);
  p.set("page", String(page));
  return p.toString();
}

export function SearchResults({ initialQuery = "", initialType = "all" }: SearchResultsProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<ResultType>(initialType);
  const [results, setResults] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(initialQuery.trim() !== "");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(initialQuery.trim() !== "");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  const didInit = useRef(false);
  const typeRef = useRef(type);
  const lastFiredRef = useRef("");

  const runSearch = useCallback(
    async (q: string, t: ResultType, p: number, replace: boolean) => {
      if (!q.trim()) {
        setResults([]);
        setTotalResults(0);
        setLoading(false);
        setInitialLoading(false);
        return;
      }
      if (replace && p === 1) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetch(`/api/search?${buildQuery(q, t, p)}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as {
          results: Media[];
          totalPages: number;
          totalResults: number;
        };
        if (p === 1) {
          setResults(data.results);
          setPage(1);
          lastFiredRef.current = `${q.trim()}::${t}`;
        } else {
          setResults((prev) => [...prev, ...data.results]);
          setPage(p);
        }
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults);
        setHasSearched(true);
      } catch {
        setError("Something went wrong with your search. Try again.");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  // Initial search from URL on mount
  useEffect(() => {
    if (didInit.current || !initialQuery.trim()) {
      didInit.current = true;
      return;
    }
    didInit.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/search?${buildQuery(initialQuery, initialType, 1)}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as {
          results: Media[];
          totalPages: number;
          totalResults: number;
        };
        if (cancelled) return;
        setResults(data.results);
        lastFiredRef.current = `${initialQuery.trim()}::${initialType}`;
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults);
      } catch {
        if (!cancelled) setError("Something went wrong with your search. Try again.");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  // Live search: debounce the query as the user types
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setTotalResults(0);
      setHasSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      const t = typeRef.current;
      const key = `${q}::${t}`;
      if (key === lastFiredRef.current) return;
      router.replace(`/search?q=${encodeURIComponent(q)}&type=${t}`, { scroll: false });
      runSearch(q, t, 1, true);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    loadMoreRef.current = () => {
      if (loading || page >= totalPages || !query.trim()) return;
      runSearch(query, type, page + 1, false);
    };
  }, [loading, page, totalPages, query, type, runSearch]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, page, totalPages, query, type]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}&type=${type}`, { scroll: false });
    runSearch(q, type, 1, true);
  };

  const changeType = (t: ResultType) => {
    setType(t);
    router.replace(`/search?q=${encodeURIComponent(query.trim())}&type=${t}`, { scroll: false });
    runSearch(query.trim(), t, 1, true);
  };

  const tabs: { v: ResultType; label: string }[] = [
    { v: "all", label: "All" },
    { v: "movie", label: "Movies" },
    { v: "tv", label: "TV Shows" },
    { v: "anime", label: "Anime" },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="mx-auto w-full max-w-2xl" role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows..."
            aria-label="Search"
            className="h-12 w-full rounded-2xl border border-white/10 bg-surface-elevated py-4 pl-12 pr-11 text-base text-foreground placeholder:text-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
              }}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-white/[0.06] hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </form>

      <div className="mx-auto flex w-full max-w-2xl items-center gap-1 rounded-full border border-white/10 bg-surface-elevated p-1">
        {tabs.map((t) => (
          <button
            key={t.v}
            type="button"
            aria-pressed={type === t.v}
            onClick={() => changeType(t.v)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors",
              type === t.v
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-secondary hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {hasSearched && !initialLoading && !error && (
        <p className="text-center text-sm text-muted">
          {totalResults.toLocaleString()} result{totalResults === 1 ? "" : "s"} for &ldquo;
          {query}&rdquo;
        </p>
      )}

      {error ? (
        <ErrorState />
      ) : initialLoading ? (
        <MediaGridSkeleton count={12} />
      ) : hasSearched && results.length === 0 && !loading ? (
        <EmptyState
          title="No results found"
          description={`We couldn't find anything matching "${query}". Try a different search.`}
        />
      ) : results.length > 0 ? (
        <>
          <MediaGrid items={results} />
          <div ref={sentinelRef} className="flex justify-center py-6">
            {loading && (
              <Loader2 className="h-6 w-6 animate-spin text-accent" aria-label="Loading more" />
            )}
            {!loading && page >= totalPages && (
              <p className="text-sm text-muted">You&apos;ve reached the end.</p>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title="Search for something"
          description="Find movies and TV shows by title, actor, or keyword."
        />
      )}
    </div>
  );
}
