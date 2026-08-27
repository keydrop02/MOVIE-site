"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { tmdbImage } from "@/lib/images";
import { isEpisodeWatched, subscribe } from "@/lib/local-store";
import { withNamespace, type Namespace } from "@/lib/routes";
import type { Episode } from "@/lib/api/types";
import { cn, formatDate, formatRuntime } from "@/lib/utils";

export function EpisodeCard({
  episode,
  tvId,
  active = false,
  keepNamespace = false,
}: {
  episode: Episode;
  tvId: number;
  /** Marks the card of the episode currently being watched. */
  active?: boolean;
  /** Keep `?ns=anime` on the play link (anime-namespace sessions). */
  keepNamespace?: boolean;
}) {
  const still = tmdbImage(episode.stillPath, "still", "md");
  const airDate = formatDate(episode.airDate);
  const runtime = formatRuntime(episode.runtime);
  const ns: Namespace = keepNamespace ? "anime" : "standard";
  const href = withNamespace(
    `/watch/tv/${tvId}/${episode.seasonNumber}/${episode.episodeNumber}`,
    ns
  );
  const watched = useSyncExternalStore(
    subscribe,
    () => isEpisodeWatched("tv", tvId, episode.seasonNumber, episode.episodeNumber),
    () => false
  );

  return (
    <article
      aria-current={active || undefined}
      className={cn(
        "group relative flex gap-4 rounded-card border bg-card p-3 transition-colors",
        active ? "border-gold" : "border-border hover:border-gold/50"
      )}
    >
      {/* Stretched link: makes the whole card tappable */}
      <Link
        href={href}
        aria-label={`Play episode ${episode.episodeNumber}: ${episode.name}`}
        className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
      />

      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-border bg-surface sm:w-48">
        {still ? (
          <Image
            src={still}
            alt=""
            fill
            sizes="(max-width: 640px) 112px, 192px"
            className={cn(
              "object-cover transition duration-300 group-hover:scale-[1.02]",
              watched && "opacity-60"
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface font-mono text-sm text-faint">
            No preview
          </div>
        )}
        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground backdrop-blur-sm">
          E{String(episode.episodeNumber).padStart(2, "0")}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition group-hover:opacity-100"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-gold text-background shadow-lg">
            <Play className="size-5 fill-current" />
          </span>
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-1 min-w-0 text-sm font-semibold text-foreground transition-colors group-hover:text-gold">
          {episode.episodeNumber}. {episode.name}
        </h3>
        <p className="mt-1 font-mono text-xs text-faint">
          {[airDate, runtime].filter(Boolean).join(" · ") || "Air date TBA"}
        </p>
        {episode.overview && (
          <p
            className={cn(
              "mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted transition-opacity sm:line-clamp-3",
              watched && "opacity-60"
            )}
          >
            {episode.overview}
          </p>
        )}
      </div>
    </article>
  );
}

export function EpisodeList({
  episodes,
  tvId,
  activeEpisode,
  keepNamespace = false,
}: {
  episodes: Episode[];
  tvId: number;
  /** Episode number of the episode currently being watched, if any. */
  activeEpisode?: number;
  /** Keep `?ns=anime` on episode play links (anime-namespace sessions). */
  keepNamespace?: boolean;
}) {
  if (!episodes.length) {
    return (
      <p className="rounded-card border border-dashed border-border bg-card/50 px-6 py-8 text-center text-sm text-muted">
        No episode information available for this season yet.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {episodes.map((episode) => (
        <EpisodeCard
          key={episode.id}
          episode={episode}
          tvId={tvId}
          active={episode.episodeNumber === activeEpisode}
          keepNamespace={keepNamespace}
        />
      ))}
    </div>
  );
}
