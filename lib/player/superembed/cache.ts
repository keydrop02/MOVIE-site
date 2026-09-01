import "server-only";

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// ── SQLite-backed cache for SuperEmbed API results ──────────────────────────
//
// SuperEmbed rate-limits its JSON API to 10 requests / 10s / IP and generated
// links expire after 48 hours. We keep results locally and only re-fetch when
// a record is older than 48h. See lib/player/superembed/README in upstream
// docs: https://www.superembed.stream/movie-streaming-api.html

const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function cacheDir(): string {
  const candidate = process.env.SUPEREMBED_CACHE_DIR;
  if (candidate && fs.existsSync(candidate)) return candidate;
  let dir = path.join(process.cwd(), ".cache", "superembed");
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      dir = path.join(process.env.TEMP ?? "/tmp", "superembed-cache");
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    }
  }
  return dir;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  db = new Database(path.join(cacheDir(), "stream_cache.sqlite"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS stream_cache (
      media_type    TEXT NOT NULL,
      media_id      TEXT NOT NULL,
      season_episode TEXT NOT NULL,
      api_payload   TEXT NOT NULL,
      updated_at    INTEGER NOT NULL,
      PRIMARY KEY (media_type, media_id, season_episode)
    );
  `);
  return db;
}

export interface SuperEmbedCacheEntry {
  payload: string;
  updatedAtMs: number;
}

/**
 * Returns a cached payload if present and not older than 48 hours.
 * `api_payload` is kept as the raw JSON text so we never reshape upstream data.
 */
export function getCachedStreams(
  mediaType: "movie" | "tv",
  mediaId: string,
  seasonEpisode: string,
): SuperEmbedCacheEntry | null {
  const row = getDb()
    .prepare(
      `SELECT api_payload, updated_at FROM stream_cache
       WHERE media_type = ? AND media_id = ? AND season_episode = ?`,
    )
    .get(mediaType, mediaId, seasonEpisode) as
    | { api_payload: string; updated_at: number }
    | undefined;

  if (!row) return null;
  const updatedAtMs = row.updated_at;
  if (Date.now() - updatedAtMs > TTL_MS) return null; // expired
  return { payload: row.api_payload, updatedAtMs };
}

/** Stores a payload (raw JSON text) for the given key set. */
export function setCachedStreams(
  mediaType: "movie" | "tv",
  mediaId: string,
  seasonEpisode: string,
  payload: string,
): void {
  getDb()
    .prepare(
      `INSERT INTO stream_cache (media_type, media_id, season_episode, api_payload, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(media_type, media_id, season_episode)
       DO UPDATE SET api_payload = excluded.api_payload, updated_at = excluded.updated_at`,
    )
    .run(mediaType, mediaId, seasonEpisode, payload, Date.now());
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