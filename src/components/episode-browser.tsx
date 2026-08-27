"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Episode, SeasonSummary } from "@/lib/api/types";
import { EpisodeList } from "./episode-card";
import { SeasonSelector } from "./season-selector";

/** Episodes shown before the "Load more" button appears. */
const PAGE_SIZE = 24;

/**
 * Client-side browser for a season's episodes: season picker on the left,
 * instant filter box on the right, paginated list below.
 */
export function EpisodeBrowser(
  props: {
    tvId: number;
    seasons?: SeasonSummary[];
    activeSeason?: number;
    episodes: Episode[];
    /** Resolved playing episode's real number (may differ under absolute numbering). */
    activeEpisode?: number;
    keepNamespace?: boolean;
  }
) {
  // Remount per series+season so paging/search state never leaks across them.
  return <EpisodeBrowserInner key={`${props.tvId}/${props.activeSeason}`} {...props} />;
}

function EpisodeBrowserInner({
  tvId,
  seasons,
  activeSeason,
  episodes,
  activeEpisode,
  keepNamespace = false,
}: {
  tvId: number;
  seasons?: SeasonSummary[];
  activeSeason?: number;
  episodes: Episode[];
  activeEpisode?: number;
  keepNamespace?: boolean;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  // Deep links must keep the playing episode's card visible without clicking.
  const [visibleCount, setVisibleCount] = useState(() => {
    const index =
      activeEpisode != null
        ? episodes.findIndex((episode) => episode.episodeNumber === activeEpisode)
        : -1;
    return Math.max(PAGE_SIZE, index + 1);
  });

  // Reset pagination whenever the filter text changes.
  const [lastQuery, setLastQuery] = useState(q);
  if (lastQuery !== q) {
    setLastQuery(q);
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    if (!q) return episodes;
    return episodes.filter(
      (episode) =>
        episode.name?.toLowerCase().includes(q) ||
        String(episode.episodeNumber).includes(q) ||
        episode.overview?.toLowerCase().includes(q)
    );
  }, [episodes, q]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const showSelector =
    Boolean(seasons && seasons.length > 1) && activeSeason != null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {showSelector ? (
          <SeasonSelector
            tvId={tvId}
            seasons={seasons!}
            activeSeason={activeSeason}
            keepNamespace={keepNamespace}
          />
        ) : null}
        <label className="relative ml-auto block w-full max-w-60">
          <span className="sr-only">Search episodes</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search episodes…"
            autoComplete="off"
            maxLength={100}
            className="h-9 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-faint transition focus:border-gold focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </label>
      </div>

      {episodes.length > 0 && filtered.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-card/50 px-6 py-8 text-center text-sm text-muted">
          No episodes match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <>
          <EpisodeList
            episodes={visible}
            tvId={tvId}
            activeEpisode={activeEpisode}
            keepNamespace={keepNamespace}
          />
          {visible.length < filtered.length ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-card/70 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Load more ({visible.length} of {filtered.length})
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
