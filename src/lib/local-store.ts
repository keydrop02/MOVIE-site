import type { MediaType } from "@/lib/site";
import type { WatchlistStatus } from "@/lib/watchlist-status";

export interface StoredItem {
  tmdbId: number;
  type: MediaType;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  rating?: number;
  year?: number;
  /** Optional explicit link override; defaults to the standard TMDB routes. */
  href?: string;
}

export interface WatchlistEntry extends StoredItem {
  addedAt: number;
  /** Set when the user picks a status; legacy entries may omit it. */
  status?: WatchlistStatus;
}

export interface HistoryEntry extends StoredItem {
  watchedAt: number;
  season?: number;
  episode?: number;
}

const WATCHLIST_KEY = "movieo:watchlist.v1";
const HISTORY_KEY = "movieo:history.v1";
const STORE_EVENT = "movieo:store";
const MAX_HISTORY = 100;
const LEGACY_PURGE_KEY = "movieo:purged-anilist.v1";

/**
 * One-time cleanup: the AniList-backed `/anime` pages were removed, so saved
 * entries pointing at those routes can never resolve again. Drops them on
 * first client load after the change. Watched-episode flags keyed by old
 * AniList IDs are indistinguishable from TMDB ones and are left as-is.
 */
function purgeLegacyAnimeEntries(): void {
  if (!isBrowser()) return;
  try {
    if (window.localStorage.getItem(LEGACY_PURGE_KEY)) return;
    window.localStorage.setItem(LEGACY_PURGE_KEY, "1");
  } catch {
    return; // storage blocked — nothing to purge safely
  }
  const isLegacy = (entry: { href?: string }) =>
    Boolean(entry.href?.startsWith("/anime/"));
  const watchlist = getWatchlist();
  if (watchlist.some(isLegacy)) {
    writeJson(WATCHLIST_KEY, watchlist.filter((entry) => !isLegacy(entry)));
  }
  const history = getHistory();
  if (history.some(isLegacy)) {
    writeJson(HISTORY_KEY, history.filter((entry) => !isLegacy(entry)));
  }
}

if (isBrowser()) purgeLegacyAnimeEntries();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch {
    /* storage full or blocked — fail silently */
  }
}

/** Subscribe to store mutations (same tab and cross-tab). */
export function subscribe(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(STORE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(STORE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

// ---------------------------------------------------------------------------
// Watchlist
// ---------------------------------------------------------------------------

export function getWatchlist(): WatchlistEntry[] {
  return readJson<WatchlistEntry[]>(WATCHLIST_KEY, []).filter(
    (entry) => entry && typeof entry.tmdbId === "number"
  );
}

export function isInWatchlist(type: MediaType, tmdbId: number): boolean {
  return getWatchlist().some((e) => e.type === type && e.tmdbId === tmdbId);
}

export function getWatchlistStatus(type: MediaType, tmdbId: number): WatchlistStatus | null {
  return getWatchlist().find((e) => e.type === type && e.tmdbId === tmdbId)?.status ?? null;
}

/** Upserts an entry with the given status; returns true when a new entry was added. */
export function setWatchlistStatus(item: StoredItem, status: WatchlistStatus): boolean {
  const list = getWatchlist();
  const index = list.findIndex((e) => e.type === item.type && e.tmdbId === item.tmdbId);
  if (index >= 0) {
    list[index] = { ...list[index], status };
    writeJson(WATCHLIST_KEY, list);
    return false;
  }
  list.unshift({ ...item, addedAt: Date.now(), status });
  writeJson(WATCHLIST_KEY, list);
  return true;
}

export function removeFromWatchlist(type: MediaType, tmdbId: number): void {
  writeJson(
    WATCHLIST_KEY,
    getWatchlist().filter((e) => !(e.type === type && e.tmdbId === tmdbId))
  );
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function historyKeyOf(entry: Pick<HistoryEntry, "type" | "tmdbId" | "season" | "episode">): string {
  return `${entry.type}-${entry.tmdbId}-${entry.season ?? "m"}-${entry.episode ?? ""}`;
}

export function getHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, []).filter(
    (entry) => entry && typeof entry.tmdbId === "number"
  );
}

/** Records a watch event; re-watching the same movie/episode bumps it to the top. */
export function recordWatch(item: StoredItem, seasonEpisode?: { season: number; episode: number }): void {
  const history = getHistory();
  const key = historyKeyOf({ ...item, ...seasonEpisode });
  const filtered = history.filter((e) => historyKeyOf(e) !== key);
  filtered.unshift({
    ...item,
    watchedAt: Date.now(),
    ...(seasonEpisode ?? {}),
  });
  writeJson(HISTORY_KEY, filtered.slice(0, MAX_HISTORY));
}

export function removeFromHistory(key: string): void {
  writeJson(
    HISTORY_KEY,
    getHistory().filter((e) => historyKeyOf(e) !== key)
  );
}

/** Removes every recorded visit (all episodes/seasons) of one title. */
export function removeTitleFromHistory(type: MediaType, tmdbId: number): void {
  writeJson(
    HISTORY_KEY,
    getHistory().filter((e) => !(e.type === type && e.tmdbId === tmdbId))
  );
}

export function clearHistory(): void {
  writeJson(HISTORY_KEY, []);
}

// ---------------------------------------------------------------------------
// Manually marked episodes ("watched" toggles)
// ---------------------------------------------------------------------------

const WATCHED_KEY = "movieo:watched.v1";

export interface WatchedEpisodeEntry {
  type: MediaType;
  tmdbId: number;
  /** Undefined for anime, which is tracked as season 1 upstream. */
  season?: number;
  episode: number;
  markedAt: number;
}

function watchedKeyOf(
  type: MediaType,
  tmdbId: number,
  season: number | undefined,
  episode: number
): string {
  return `${type}-${tmdbId}-${season ?? "a"}-${episode}`;
}

export function getWatchedEpisodes(): WatchedEpisodeEntry[] {
  return readJson<WatchedEpisodeEntry[]>(WATCHED_KEY, []).filter(
    (entry) => entry && typeof entry.tmdbId === "number" && typeof entry.episode === "number"
  );
}

export function isEpisodeWatched(
  type: MediaType,
  tmdbId: number,
  season: number | undefined,
  episode: number
): boolean {
  const key = watchedKeyOf(type, tmdbId, season, episode);
  return getWatchedEpisodes().some((e) => watchedKeyOf(e.type, e.tmdbId, e.season, e.episode) === key);
}

/** Marks/unmarks an episode; returns true when it ended up watched. */
export function toggleEpisodeWatched(
  type: MediaType,
  tmdbId: number,
  season: number | undefined,
  episode: number
): boolean {
  const list = getWatchedEpisodes();
  const key = watchedKeyOf(type, tmdbId, season, episode);
  const index = list.findIndex(
    (e) => watchedKeyOf(e.type, e.tmdbId, e.season, e.episode) === key
  );
  let marked: boolean;
  if (index >= 0) {
    list.splice(index, 1);
    marked = false;
  } else {
    list.unshift({ type, tmdbId, season, episode, markedAt: Date.now() });
    marked = true;
  }
  writeJson(WATCHED_KEY, list);
  return marked;
}
