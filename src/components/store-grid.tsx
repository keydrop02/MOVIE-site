"use client";

import { Trash2 } from "lucide-react";
import { MediaCard } from "./media-card";
import type { StoredItem } from "@/lib/local-store";
import type { MediaItem } from "@/lib/api/types";

export function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function toMediaItem(
  entry: StoredItem,
  watchHref?: string
): MediaItem {
  return {
    id: `${entry.type}-${entry.tmdbId}`,
    tmdbId: entry.tmdbId,
    type: entry.type,
    title: entry.title,
    posterPath: entry.posterPath,
    backdropPath: entry.backdropPath,
    rating: entry.rating,
    year: entry.year,
    href: entry.href,
    watchHref,
  };
}

/** Grid of locally-stored titles with an optional per-tile remove button. */
export function StoreItemGrid({
  entries,
}: {
  entries: Array<{
    key: string;
    item: StoredItem;
    /** Overrides the hover-play target (e.g. resume a specific episode). */
    watchHref?: string;
    caption?: string;
    onRemove?: () => void;
  }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
      {entries.map(({ key, item, watchHref, caption, onRemove }) => (
        <div key={key} className="relative">
          <MediaCard
            item={toMediaItem(item, watchHref)}
            topRightAction={
              onRemove ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove();
                  }}
                  aria-label={`Remove ${item.title}`}
                  className="flex size-6 items-center justify-center rounded-full bg-black/70 text-foreground backdrop-blur-sm transition hover:bg-red-500 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
                >
                  <Trash2 className="size-3" aria-hidden />
                </button>
              ) : undefined
            }
          />
          {caption && (
            <p className="mt-1 px-0.5 font-mono text-xs text-faint">{caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}
