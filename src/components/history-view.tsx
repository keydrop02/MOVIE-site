"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { History, Trash2 } from "lucide-react";
import {
  clearHistory,
  getHistory,
  removeTitleFromHistory,
  subscribe,
} from "@/lib/local-store";
import type { HistoryEntry } from "@/lib/local-store";
import { EmptyState } from "./empty-state";
import { GridSkeleton } from "./loading-skeleton";
import { StoreItemGrid, relativeTime } from "./store-grid";

function groupByTitle(entries: HistoryEntry[]): HistoryEntry[] {
  const byTitle = new Map<string, HistoryEntry>();
  for (const entry of [...entries].sort((a, b) => b.watchedAt - a.watchedAt)) {
    const key = `${entry.type}-${entry.tmdbId}`;
    if (!byTitle.has(key)) byTitle.set(key, entry);
  }
  return [...byTitle.values()];
}

export function HistoryView() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    const sync = () => setEntries(getHistory());
    sync();
    return subscribe(sync);
  }, []);

  const groups = useMemo(() => (entries ? groupByTitle(entries) : []), [entries]);

  if (entries === null) {
    return <GridSkeleton count={12} />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No watch history yet"
        message="Titles you play will show up here so you can pick up where you left off."
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Start watching
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-widest text-faint uppercase">
          {groups.length} title{groups.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear your entire watch history? This can't be undone.")) {
              clearHistory();
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-red-400 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Clear history
        </button>
      </div>
      <StoreItemGrid
        entries={groups.map((entry) => ({
          key: `${entry.type}-${entry.tmdbId}`,
          item: entry,
          // Resume straight into the last-opened episode.
          watchHref:
            entry.type === "tv" && entry.season != null && entry.episode != null
              ? `/watch/tv/${entry.tmdbId}/${entry.season}/${entry.episode}`
              : undefined,
          caption:
            (entry.season != null && entry.episode != null
              ? `S${String(entry.season).padStart(2, "0")}·E${String(entry.episode).padStart(2, "0")} · `
              : "") + relativeTime(entry.watchedAt),
          onRemove: () => removeTitleFromHistory(entry.type, entry.tmdbId),
        }))}
      />
    </>
  );
}
