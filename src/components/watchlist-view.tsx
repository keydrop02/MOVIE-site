"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import {
  getWatchlist,
  removeFromWatchlist,
  subscribe,
} from "@/lib/local-store";
import type { WatchlistEntry } from "@/lib/local-store";
import { WATCHLIST_STATUSES, watchlistStatusLabel } from "@/lib/watchlist-status";
import { EmptyState } from "./empty-state";
import { GridSkeleton } from "./loading-skeleton";
import { StoreItemGrid } from "./store-grid";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "movie" | "tv";

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" },
];

const TYPE_EMPTY_LABELS: Record<TypeFilter, string> = {
  all: "titles",
  movie: "movies",
  tv: "TV shows",
};

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold",
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-border bg-card text-muted hover:border-gold/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function WatchlistView() {
  const [entries, setEntries] = useState<WatchlistEntry[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    const sync = () => setEntries(getWatchlist());
    sync();
    return subscribe(sync);
  }, []);

  if (entries === null) {
    return <GridSkeleton count={12} />;
  }

  const statusCounts: Record<string, number> = { all: entries.length };
  for (const status of WATCHLIST_STATUSES) statusCounts[status.value] = 0;
  for (const entry of entries) {
    if (entry.status) statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
  }

  const filtered = entries.filter((entry) => {
    if (statusFilter !== "all" && entry.status !== statusFilter) return false;
    if (typeFilter !== "all" && entry.type !== typeFilter) return false;
    return true;
  });

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={BookmarkPlus}
        title="Your watchlist is empty"
        message="Tap “Add to Watchlist” on any movie or show to save it here for later."
        action={
          <Link
            href="/movies"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Browse movies
          </Link>
        }
      />
    );
  }

  return (
    <>
      {/* Status tabs */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterTab
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          All
        </FilterTab>
        {WATCHLIST_STATUSES.map((status) => (
          <FilterTab
            key={status.value}
            active={statusFilter === status.value}
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label}
          </FilterTab>
        ))}
      </div>

      {/* Type tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((type) => (
          <FilterTab
            key={type.value}
            active={typeFilter === type.value}
            onClick={() => setTypeFilter(type.value)}
          >
            {type.label}
          </FilterTab>
        ))}
      </div>

      {filtered.length > 0 ? (
        <StoreItemGrid
          entries={filtered.map((entry) => ({
            key: `${entry.type}-${entry.tmdbId}`,
            item: entry,
            caption:
              entry.status && statusFilter === "all"
                ? watchlistStatusLabel(entry.status)
                : undefined,
            onRemove: () => removeFromWatchlist(entry.type, entry.tmdbId),
          }))}
        />
      ) : (
        <p className="rounded-card border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted">
          No{" "}
          {[
            statusFilter !== "all" ? watchlistStatusLabel(statusFilter).toLowerCase() : null,
            typeFilter !== "all" ? TYPE_EMPTY_LABELS[typeFilter] : "titles",
          ]
            .filter(Boolean)
            .join(" ")}{" "}
          yet.
        </p>
      )}
    </>
  );
}
