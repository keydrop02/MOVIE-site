import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { SeasonSummary } from "@/lib/api/types";
import { withNamespace } from "@/lib/routes";
import { cn, formatDate } from "@/lib/utils";

export function SeasonCard({
  season,
  tvId,
  keepNamespace = false,
}: {
  season: SeasonSummary;
  tvId: number;
  /** Keep `?ns=anime` on the play link (anime-namespace sessions). */
  keepNamespace?: boolean;
}) {
  const poster = tmdbImage(season.posterPath, "poster", "sm");
  const airDate = formatDate(season.airDate);

  return (
    <Link
      href={withNamespace(
        `/watch/tv/${tvId}/${season.seasonNumber}/1`,
        keepNamespace ? "anime" : "standard"
      )}
      className={cn(
        "group flex gap-4 rounded-card border border-border bg-card p-3 transition-colors hover:border-border-strong",
        "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold"
      )}
      aria-label={`Play ${season.name}, first episode`}
    >
      <div className="relative w-20 shrink-0 aspect-[2/3] overflow-hidden rounded-md border border-border bg-surface">
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center font-mono text-[10px] text-faint">
            No poster
          </div>
        )}
      </div>
      <div className="min-w-0 py-1">
        <p className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-gold">
          {season.name}
        </p>
        <p className="mt-1 font-mono text-xs text-faint">
          {season.episodeCount} episodes{airDate ? ` · ${airDate}` : ""}
        </p>
        {season.overview && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
            {season.overview}
          </p>
        )}
      </div>
    </Link>
  );
}

export function SeasonGrid({
  seasons,
  tvId,
  keepNamespace = false,
}: {
  seasons: SeasonSummary[];
  tvId: number;
  /** Keep `?ns=anime` on season play links (anime-namespace sessions). */
  keepNamespace?: boolean;
}) {
  if (!seasons.length) {
    return (
      <p className="rounded-card border border-dashed border-border bg-card/50 px-6 py-8 text-center text-sm text-muted">
        No season information available for this series yet.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {seasons.map((season) => (
        <SeasonCard
          key={season.id}
          season={season}
          tvId={tvId}
          keepNamespace={keepNamespace}
        />
      ))}
    </div>
  );
}
