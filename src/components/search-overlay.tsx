"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";
import type { MediaItem, PersonSummary } from "@/lib/api/types";
import type { SearchGroups } from "@/lib/api/search";
import { tmdbImage } from "@/lib/images";
import { cn, formatRating } from "@/lib/utils";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const ROWS_PER_GROUP = 4;
const CACHE_MAX = 20;

const EMPTY_GROUPS: SearchGroups = {
  movies: [],
  tv: [],
  people: [],
  page: 1,
  totalPages: 0,
  totalResults: 0,
};

type Status = "idle" | "loading" | "done" | "error";

/**
 * Dropdown instant-search attached to the navbar: debounced results in a
 * floating panel, with an escape hatch to the full /search page.
 */
export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroups | null>(null);
  /** Which query `groups` belongs to — hides stale rows while typing. */
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, SearchGroups>>(new Map());
  /**
   * When the desktop trigger is visible, the panel's left edge locks to the
   * trigger's left edge (clamped to the viewport). Null = mobile sheet mode.
   */
  const [panelLeft, setPanelLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = document
        .getElementById("site-search-desktop")
        ?.getBoundingClientRect();
      if (!anchor || anchor.width === 0) {
        setPanelLeft(null);
        return;
      }
      const width = panelRef.current?.offsetWidth ?? 416;
      setPanelLeft(
        Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16))
      );
    };
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Autofocus, scroll lock and Escape-to-close while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const search = useCallback(async (q: string) => {
    const cached = cacheRef.current.get(q);
    if (cached) {
      setGroups(cached);
      setResultsFor(q);
      setStatus("done");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=quick`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as SearchGroups;
      if (controller !== abortRef.current) return;

      cacheRef.current.set(q, data);
      if (cacheRef.current.size > CACHE_MAX) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) cacheRef.current.delete(firstKey);
      }

      setGroups(data);
      setResultsFor(q);
      setStatus("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (controller !== abortRef.current) return;
      setStatus("error");
    }
  }, []);

  // Debounced lookup; stale rows are hidden via `resultsFor`, so no
  // synchronous state clearing is needed when the query shrinks.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    const timer = setTimeout(() => void search(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open, search]);

  function goToFullResults() {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const fresh = resultsFor === trimmedQuery && resultsFor !== null;
  const effectiveGroups = groups ?? EMPTY_GROUPS;
  const totalRows =
    effectiveGroups.movies.length +
    effectiveGroups.tv.length +
    effectiveGroups.people.length;

  return (
    <>
      {/* Backdrop sits under the header so the navbar stays visible */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-background/60 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Search results"
        aria-hidden={!open}
        style={
          panelLeft != null
            ? ({ left: panelLeft, right: "auto" } satisfies CSSProperties)
            : undefined
        }
        className={cn(
          "fixed top-20 z-50 overflow-hidden rounded-card border border-border bg-card shadow-2xl transition-all duration-200",
          panelLeft == null
            ? "right-4 left-4"
            : "w-[26rem]",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            goToFullResults();
          }}
          className="relative border-b border-border"
        >
          <label htmlFor="overlay-search-input" className="sr-only">
            Search movies, TV shows, and people
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <input
            ref={inputRef}
            id="overlay-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, TV shows, people…"
            autoComplete="off"
            maxLength={100}
            tabIndex={open ? 0 : -1}
            className="w-full bg-transparent py-3.5 pr-11 pl-11 text-sm text-foreground placeholder:text-faint focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {status === "loading" && (
            <Loader2
              aria-hidden
              className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-faint"
            />
          )}
        </form>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain">
          {!hasQuery && (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Type to search movies, TV shows, and people.
            </p>
          )}

          {hasQuery && status === "loading" && (
            <div className="space-y-3 p-4">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex animate-pulse items-center gap-3">
                  <div className="h-[3.75rem] w-10 rounded-md bg-surface" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-surface" />
                    <div className="h-2.5 w-1/3 rounded bg-surface" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasQuery && status === "error" && (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Search is unavailable right now.{" "}
              <Link href="/search" onClick={onClose} className="text-gold underline-offset-2 hover:underline">
                Open full search
              </Link>
            </p>
          )}

          {hasQuery && status === "done" && fresh && totalRows === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No results for &ldquo;{trimmedQuery}&rdquo;.
            </p>
          )}

          {hasQuery && fresh && totalRows > 0 && (
            <div className="py-2">
              {effectiveGroups.movies.length > 0 && (
                <ResultGroup label="Movies">
                  {effectiveGroups.movies
                    .slice(0, ROWS_PER_GROUP)
                    .map((item) => (
                      <MediaResultRow key={item.id} item={item} onClose={onClose} />
                    ))}
                </ResultGroup>
              )}
              {effectiveGroups.tv.length > 0 && (
                <ResultGroup label="TV Shows">
                  {effectiveGroups.tv.slice(0, ROWS_PER_GROUP).map((item) => (
                    <MediaResultRow key={item.id} item={item} onClose={onClose} />
                  ))}
                </ResultGroup>
              )}
              {effectiveGroups.people.length > 0 && (
                <ResultGroup label="People">
                  {effectiveGroups.people
                    .slice(0, ROWS_PER_GROUP)
                    .map((person) => (
                      <PersonResultRow key={person.id} person={person} onClose={onClose} />
                    ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>

        {hasQuery && (
          <button
            type="button"
            onClick={goToFullResults}
            tabIndex={open ? 0 : -1}
            className="flex w-full items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-left text-sm text-muted transition hover:bg-surface/60 hover:text-gold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
          >
            <span className="truncate">
              See all results for &ldquo;{trimmedQuery}&rdquo;
            </span>
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </button>
        )}
      </div>
    </>
  );
}

function ResultGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label}>
      <p className="px-5 pt-3 pb-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
        {label}
      </p>
      <ul>{children}</ul>
    </section>
  );
}

function MediaResultRow({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  const poster = tmdbImage(item.posterPath, "poster", "sm");
  const rating = formatRating(item.rating);
  return (
    <li>
      <Link
        href={`/${item.type}/${item.tmdbId}`}
        onClick={onClose}
        className="flex items-center gap-3 px-5 py-2 transition hover:bg-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
      >
        <span className="relative block h-[3.75rem] w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
          {poster ? (
            <Image src={poster} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-faint">
              N/A
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {item.title}
          </span>
          <span className="mt-0.5 block truncate font-mono text-xs text-faint">
            {[
              item.year,
              item.type === "movie" ? "Movie" : "TV Show",
              rating ? `★ ${rating}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </Link>
    </li>
  );
}

function PersonResultRow({
  person,
  onClose,
}: {
  person: PersonSummary;
  onClose: () => void;
}) {
  const profile = tmdbImage(person.profilePath, "profile", "sm");
  return (
    <li>
      <Link
        href={`/person/${person.id}`}
        onClick={onClose}
        className="flex items-center gap-3 px-5 py-2 transition hover:bg-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
      >
        <span className="relative block size-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
          {profile ? (
            <Image src={profile} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-sm text-faint">
              {person.name.charAt(0)}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {person.name}
          </span>
          {person.knownForDepartment && (
            <span className="mt-0.5 block truncate font-mono text-xs text-faint">
              {person.knownForDepartment}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
