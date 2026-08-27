import "server-only";
import { getApiKeys } from "./keys";

const TMDB_BASE = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";
const OMDB_BASE = process.env.OMDB_BASE_URL ?? "https://www.omdbapi.com";
// Per-attempt budget. Failing faster onto a fresh connection beats waiting
// on a stalled socket — upstream CDN edges occasionally blackhole connects.
const REQUEST_TIMEOUT_MS = 8_000;
/** Attempts per request (1 + retries). */
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 400;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function backoff(attempt: number): Promise<void> {
  // attempt is 0-based; delays: ~400ms, ~800ms, ~1200ms…
  return new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS * (attempt + 1)));
}

export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ApiConfigError extends Error {
  constructor(provider: string) {
    super(
      `No ${provider} API credentials are configured. Set the appropriate environment variables to enable this feature.`
    );
    this.name = "ApiConfigError";
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function buildUrl(base: string, path: string, params: QueryParams): URL {
  const url = new URL(`${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function fetchJson<T>(
  url: URL,
  init: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
  retries: number = MAX_RETRIES,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await backoff(attempt - 1);
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: "application/json", ...(init.headers ?? {}) },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        // Never surface credentials or full upstream bodies in errors.
        const reason =
          response.status >= 400 && response.status < 500
            ? `request rejected (${response.status})`
            : `upstream error (${response.status})`;
        if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
          lastError = new ApiError(reason, response.status);
          continue;
        }
        throw new ApiError(
          `${reason}${body ? "" : ""}`,
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      // ApiErrors carry real upstream statuses — non-retryable ones are
      // fatal, retryable ones were already accounted for above. Everything
      // else (timeouts, DNS/connect failures, aborted bodies) is worth a
      // fresh attempt on a new connection.
      if (!(error instanceof ApiError) && attempt < retries) continue;
      break;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError("The data provider is temporarily unavailable");
}

export interface TmdbRequestOptions {
  /** Seconds to keep the response cached server-side. */
  revalidate?: number;
  tags?: string[];
  /** Override per-attempt timeout (ms). */
  timeout?: number;
  /** Override max retry count. */
  retries?: number;
}

export async function tmdbGet<T>(
  path: string,
  params: QueryParams = {},
  options: TmdbRequestOptions = {}
): Promise<T> {
  const keys = await getApiKeys();
  if (!keys.tmdb) throw new ApiConfigError("TMDB");

  const url = buildUrl(TMDB_BASE, path, { ...params, api_key: keys.tmdb });
  const next: { revalidate?: number; tags?: string[] } = {};
  if (options.revalidate !== undefined) next.revalidate = options.revalidate;
  if (options.tags?.length) next.tags = options.tags;

  return fetchJson<T>(
    url,
    Object.keys(next).length ? { next } : {},
    options.retries ?? MAX_RETRIES,
    options.timeout ?? REQUEST_TIMEOUT_MS
  );
}

export async function omdbGet<T>(
  params: QueryParams
): Promise<T | null> {
  const keys = await getApiKeys();
  if (!keys.omdb) return null;

  const url = buildUrl(OMDB_BASE, "/", { ...params, apikey: keys.omdb });
  try {
    return await fetchJson<T>(url, {}, 0);
  } catch {
    // OMDb is a secondary source: never let its failures bubble up.
    return null;
  }
}
