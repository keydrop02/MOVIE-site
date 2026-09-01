"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Media, MediaType } from "@/lib/tmdb/types";
import { MediaGrid } from "@/components/media/media-grid";
import { cn } from "@/lib/utils";

type ProviderType = "all" | MediaType;

const TABS: { value: ProviderType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
];

interface ProviderBrowserProps {
  providerId: number;
  initialType: ProviderType;
  initialItems: Media[];
  totalResults: number;
  totalPages: number;
}

function merge(listA: Media[], listB: Media[]): Media[] {
  const seen = new Set(listA.map((m) => `${m.type}-${m.id}`));
  const out = [...listA];
  for (const item of listB) {
    const key = `${item.type}-${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function ProviderBrowser({
  providerId,
  initialType,
  initialItems,
  totalResults,
  totalPages,
}: ProviderBrowserProps) {
  const [items, setItems] = useState<Media[]>(initialItems);
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const type = initialType;

  const hasMore =
    type === "movie"
      ? moviePage < totalPages
      : type === "tv"
        ? tvPage < totalPages
        : moviePage < totalPages || tvPage < totalPages;

  const loadMore = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (type === "movie" || type === "tv") {
        const next = (type === "movie" ? moviePage : tvPage) + 1;
        if (next > totalPages) return;
        const res = await fetch(
          `/api/${type === "movie" ? "movies" : "tv"}?providers=${providerId}&page=${next}`
        );
        if (!res.ok) throw new Error("Failed to load more");
        const data = (await res.json()) as { results: Media[]; totalPages: number };
        setItems((prev) => merge(prev, data.results ?? []));
        if (type === "movie") setMoviePage(next);
        else setTvPage(next);
      } else {
        const [mRes, tRes] = await Promise.all([
          fetch(`/api/movies?providers=${providerId}&page=${moviePage + 1}`),
          fetch(`/api/tv?providers=${providerId}&page=${tvPage + 1}`),
        ]);
        if (!mRes.ok || !tRes.ok) throw new Error("Failed to load more");
        const mData = (await mRes.json()) as { results: Media[] };
        const tData = (await tRes.json()) as { results: Media[] };
        setItems((prev) => merge(prev, merge(mData.results ?? [], tData.results ?? [])));
        setMoviePage((p) => p + 1);
        setTvPage((p) => p + 1);
      }
    } catch {
      setError("Something went wrong loading more results. Try again.");
    } finally {
      inflightRef.current = false;
      setLoading(false);
    }
  }, [type, providerId, moviePage, tvPage, totalPages]);

  const typeLabel =
    type === "movie" ? "movies" : type === "tv" ? "shows" : "titles";

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        {totalResults.toLocaleString()} {typeLabel} available to stream
      </p>

      <div
        role="tablist"
        aria-label="Media type"
        className="mb-6 flex w-full items-center gap-1 rounded-full border border-white/10 bg-surface-elevated p-1 sm:w-fit"
      >
        {TABS.map((t) => (
          <Link
            key={t.value}
            role="tab"
            aria-selected={type === t.value}
            href={`/provider/${providerId}?type=${t.value}`}
            className={cn(
              "flex-1 whitespace-nowrap rounded-full px-5 py-2 text-center text-sm transition-colors focus:outline-none sm:flex-none",
              type === t.value
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-secondary hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <MediaGrid items={items} />

      <div className="flex flex-col items-center gap-3 py-6">
        {error && items.length > 0 && (
          <p className="text-sm text-foreground">{error}</p>
        )}
        {hasMore ? (
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
  );
}
