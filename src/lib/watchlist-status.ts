export const WATCHLIST_STATUSES = [
  { value: "watching", label: "Watching" },
  { value: "plan", label: "Plan to Watch" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
] as const;

export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number]["value"];

export function watchlistStatusLabel(value: string): string {
  return WATCHLIST_STATUSES.find((status) => status.value === value)?.label ?? "";
}
