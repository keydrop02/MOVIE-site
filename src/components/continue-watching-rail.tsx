"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { getHistory, removeTitleFromHistory, subscribe } from "@/lib/local-store";
import type { HistoryEntry } from "@/lib/local-store";
import { SectionHeader } from "./section-header";
import { MediaRow } from "./media-row";
import { MediaCard } from "./media-card";
import { toMediaItem, relativeTime } from "./store-grid";

const MAX_ITEMS = 20;

function groupByTitle(entries: HistoryEntry[]): HistoryEntry[] {
  const byTitle = new Map<string, HistoryEntry>();
  for (const entry of [...entries].sort((a, b) => b.watchedAt - a.watchedAt)) {
    const key = `${entry.type}-${entry.tmdbId}`;
    if (!byTitle.has(key)) byTitle.set(key, entry);
  }
  return [...byTitle.values()];
}

export function ContinueWatchingRail() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    const sync = () => setEntries(getHistory());
    sync();
    return subscribe(sync);
  }, []);

  const groups = useMemo(
    () => (entries ? groupByTitle(entries).slice(0, MAX_ITEMS) : []),
    [entries]
  );

  if (entries === null || groups.length === 0) return null;

  return (
    <section
      aria-label="Continue Watching"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <SectionHeader title="Continue Watching" />
      <MediaRow>
        {groups.map((entry) => (
          <div key={`${entry.type}-${entry.tmdbId}`}>
            <MediaCard
              item={toMediaItem(
                entry,
                entry.type === "tv" && entry.season != null && entry.episode != null
                  ? `/watch/tv/${entry.tmdbId}/${entry.season}/${entry.episode}`
                  : undefined
              )}
              topRightAction={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeTitleFromHistory(entry.type, entry.tmdbId);
                  }}
                  aria-label={`Remove ${entry.title}`}
                  className="flex size-6 items-center justify-center rounded-full bg-black/70 text-foreground backdrop-blur-sm transition hover:bg-red-500 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
                >
                  <Trash2 className="size-3" aria-hidden />
                </button>
              }
            />
            <p className="mt-1 px-0.5 font-mono text-xs text-faint">
              {(entry.season != null && entry.episode != null
                ? `S${String(entry.season).padStart(2, "0")}·E${String(entry.episode).padStart(2, "0")} · `
                : "") + relativeTime(entry.watchedAt)}
            </p>
          </div>
        ))}
      </MediaRow>
    </section>
  );
}
