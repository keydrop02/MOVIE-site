import "server-only";

import path from "node:path";
import fs from "node:fs";

// ── Cache for SuperEmbed API results ────────────────────────────────────────
//
// SuperEmbed rate-limits its JSON API to 10 requests / 10 s / IP and generated
// links expire after 48 hours. We keep results locally and only re-fetch when
// a record is older than 48h.
//
// Storage is SQLite when a correctly-compiled native binding and a writable
// disk are available (local/dev). On serverless hosts whose build pipeline
// cannot compile the native module (e.g. Vercel with blocked install scripts)
// or whose filesystem is read-only, this automatically degrades to an
// in-memory cache with the same TTL and shape, so the feature keeps working.

const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MEMORY_CACHE_MAX = 500;

interface CacheEntry {
  payload: string;
  updatedAtMs: number;
}

interface CacheStore {
  get(key: string): CacheEntry | null;
  set(key: string, payload: string, at: number): void;
}

interface SqliteHandle {
  pragma(sql: string): void;
  exec(sql: string): void;
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  };
}

type SqliteCtor = new (filename: string) => SqliteHandle;

let storePromise: Promise<CacheStore> | null = null;

function entryKey(
  mediaType: "movie" | "tv",
  mediaId: string,
  seasonEpisode: string,
): string {
  return `${mediaType}|${mediaId}|${seasonEpisode}`;
}

// Splits "movie|522931|1|2" back into the three SQL columns.
function splitKey(key: string): [string, string, string] {
  const [mediaType, mediaId, seasonEpisode] = key.split("|", 3);
  return [mediaType ?? "", mediaId ?? "", seasonEpisode ?? ""];
}

// ── SQLite store ────────────────────────────────────────────────────────────

function cacheDir(): string {
  const candidate = process.env.SUPEREMBED_CACHE_DIR;
  if (candidate && fs.existsSync(candidate)) return candidate;
  const dir = path.join(process.cwd(), ".cache", "superembed");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function createSqliteStore(Database: SqliteCtor): CacheStore {
  const db = new Database(path.join(cacheDir(), "stream_cache.sqlite"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS stream_cache (
      media_type     TEXT NOT NULL,
      media_id       TEXT NOT NULL,
      season_episode TEXT NOT NULL,
      api_payload    TEXT NOT NULL,
      updated_at     INTEGER NOT NULL,
      PRIMARY KEY (media_type, media_id, season_episode)
    );
  `);

  const select = db.prepare(
    `SELECT api_payload, updated_at FROM stream_cache
     WHERE media_type = ? AND media_id = ? AND season_episode = ?`,
  );
  const upsert = db.prepare(
    `INSERT INTO stream_cache (media_type, media_id, season_episode, api_payload, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(media_type, media_id, season_episode)
     DO UPDATE SET api_payload = excluded.api_payload, updated_at = excluded.updated_at`,
  );

  return {
    get(key: string): CacheEntry | null {
      const [mediaType, mediaId, seasonEpisode] = splitKey(key);
      const row = select.get(mediaType, mediaId, seasonEpisode) as
        | { api_payload: string; updated_at: number }
        | undefined;
      if (!row) return null;
      return { payload: row.api_payload, updatedAtMs: row.updated_at };
    },
    set(key: string, payload: string, at: number): void {
      const [mediaType, mediaId, seasonEpisode] = splitKey(key);
      upsert.run(mediaType, mediaId, seasonEpisode, payload, at);
    },
  };
}

// ── In-memory store (serverless fallback) ───────────────────────────────────

function createMemoryStore(): CacheStore {
  const map = new Map<string, CacheEntry>();

  return {
    get(key: string): CacheEntry | null {
      const entry = map.get(key);
      if (!entry) return null;
      if (Date.now() - entry.updatedAtMs > TTL_MS) {
        map.delete(key); // expired
        return null;
      }
      return entry;
    },
    set(key: string, payload: string, at: number): void {
      map.set(key, { payload, updatedAtMs: at });
      if (map.size > MEMORY_CACHE_MAX) {
        const oldest = map.keys().next();
        if (!oldest.done) map.delete(oldest.value);
      }
    },
  };
}

async function getStore(): Promise<CacheStore> {
  if (!storePromise) {
    storePromise = (async () => {
      try {
        if (process.env.SUPEREMBED_CACHE_DISABLE) return createMemoryStore();
        const mod = await import("better-sqlite3");
        const Database = (mod as unknown as { default: SqliteCtor }).default;
        return createSqliteStore(Database);
      } catch {
        return createMemoryStore();
      }
    })();
  }
  return storePromise;
}

/**
 * Returns a cached payload if present and not older than 48 hours.
 * `api_payload` is kept as the raw JSON text so we never reshape upstream data.
 */
export async function getCachedStreams(
  mediaType: "movie" | "tv",
  mediaId: string,
  seasonEpisode: string,
): Promise<CacheEntry | null> {
  const store = await getStore();
  const entry = store.get(entryKey(mediaType, mediaId, seasonEpisode));
  if (!entry) return null;
  if (Date.now() - entry.updatedAtMs > TTL_MS) return null; // expired
  return entry;
}

/** Stores a payload (raw JSON text) for the given key set. */
export async function setCachedStreams(
  mediaType: "movie" | "tv",
  mediaId: string,
  seasonEpisode: string,
  payload: string,
): Promise<void> {
  const store = await getStore();
  store.set(entryKey(mediaType, mediaId, seasonEpisode), payload, Date.now());
}

/** Helps stay within the 10 req / 10 s / IP limit. */
export async function gateRateLimit(): Promise<void> {
  const now = Date.now();
  // In-process guard: never hammer the upstream API more than 1×/1.1 s.
  // (Instance-local only; not shared across hosts.)
  const global = globalThis as unknown as { __superembedLastRequest?: number };
  const last = global.__superembedLastRequest ?? 0;
  const wait = Math.max(0, last + 1100 - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  global.__superembedLastRequest = now + (wait > 0 ? wait : 0);
}