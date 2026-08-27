"use client";

import { useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import {
  getWatchlistStatus,
  removeFromWatchlist,
  setWatchlistStatus,
  subscribe,
} from "@/lib/local-store";
import type { StoredItem } from "@/lib/local-store";
import { WATCHLIST_STATUSES } from "@/lib/watchlist-status";
import { Dropdown } from "./dropdown";
import { StatusIcon } from "./status-icon";
import { cn } from "@/lib/utils";

const REMOVE = "__remove__";

/**
 * MOVIEO-style watchlist control: pick a status to save the title; once
 * saved the trigger shows the current status and offers "Remove from list".
 *
 * useSyncExternalStore keeps this in sync with localStorage: the server
 * snapshot is always unsaved so hydration never mismatches, and every
 * store mutation (any tab) re-renders with the real value.
 */
export function WatchlistButton({ item }: { item: StoredItem }) {
  const status = useSyncExternalStore(
    subscribe,
    () => getWatchlistStatus(item.type, item.tmdbId),
    () => null
  );
  const saved = status !== null;

  return (
    <Dropdown
      ariaLabel="Watchlist status"
      value={saved ? status : ""}
      placeholder="Add to Watchlist"
      leading={
        saved ? (
          <StatusIcon status={status} className="size-4 shrink-0" />
        ) : (
          <Plus className="size-4 shrink-0" aria-hidden />
        )
      }
      onChange={(next) => {
        if (next === REMOVE) {
          removeFromWatchlist(item.type, item.tmdbId);
        } else {
          setWatchlistStatus(
            item,
            next as (typeof WATCHLIST_STATUSES)[number]["value"]
          );
        }
      }}
      options={[
        ...WATCHLIST_STATUSES.map((status) => ({
          value: status.value,
          label: status.label,
          icon: <StatusIcon status={status.value} className="size-4" />,
        })),
        ...(saved
          ? [
              {
                value: REMOVE,
                label: "Remove from list",
                danger: true,
                divider: true,
                icon: <StatusIcon status="dropped" className="size-4" />,
              },
            ]
          : []),
      ]}
      menuClassName="w-52"
      className={cn(
        "h-11 justify-between rounded-lg px-5 text-sm font-semibold backdrop-blur transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        saved
          ? "border border-gold text-gold hover:brightness-110"
          : "border border-border-strong bg-card/70 text-foreground hover:border-gold hover:text-gold"
      )}
    />
  );
}
