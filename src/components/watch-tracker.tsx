"use client";

import { useEffect } from "react";
import { recordWatch } from "@/lib/local-store";
import type { StoredItem } from "@/lib/local-store";

/**
 * Invisible client component placed on watch pages: records the title (or a
 * specific episode) into the local watch history once per page view.
 */
export function WatchTracker({
  item,
  seasonEpisode,
}: {
  item: StoredItem;
  seasonEpisode?: { season: number; episode: number };
}) {
  useEffect(() => {
    recordWatch(item, seasonEpisode);
    // Snapshot props only — re-record intentionally on route change, which
    // remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.tmdbId, item.type, seasonEpisode?.season, seasonEpisode?.episode]);

  return null;
}
