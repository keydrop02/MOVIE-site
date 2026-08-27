"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { SeasonSummary } from "@/lib/api/types";
import { withNamespace, type Namespace } from "@/lib/routes";
import { Dropdown } from "./dropdown";

/**
 * Season switcher for the watch page: picking a season jumps to its first
 * episode so playback continues into the newly selected season.
 */
export function SeasonSelector({
  tvId,
  seasons,
  activeSeason,
  keepNamespace = false,
}: {
  tvId: number;
  seasons: SeasonSummary[];
  activeSeason: number;
  /** Keep `?ns=anime` on the target URL (anime-namespace sessions). */
  keepNamespace?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ns: Namespace = keepNamespace ? "anime" : "standard";

  return (
    <div className="relative w-max">
      <Dropdown
        ariaLabel="Season"
        value={String(activeSeason)}
        options={seasons.map((season) => ({
          value: String(season.seasonNumber),
          label: season.name,
        }))}
        disabled={pending}
        onChange={(next) =>
          startTransition(() => {
            router.push(withNamespace(`/watch/tv/${tvId}/${next}/1`, ns));
          })
        }
        className="h-9 min-w-44 justify-between rounded-lg border border-border bg-card px-4 pr-2.5 text-sm font-medium text-foreground"
      />
      {pending && (
        <Loader2
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-7 size-4 -translate-y-1/2 animate-spin text-faint"
        />
      )}
    </div>
  );
}
