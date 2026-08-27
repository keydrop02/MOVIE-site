import "server-only";
import { omdbGet } from "./client";
import type { OmdbTitleResponse } from "./types";

export interface OmdbEnrichment {
  imdbRating?: string;
  metascore?: string;
  rated?: string;
}

function parseRuntime(runtime?: string): number | undefined {
  if (!runtime || runtime === "N/A") return undefined;
  const match = /(\d+)\s*min/.exec(runtime);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

/**
 * Look up a title on OMDb by IMDb ID (preferred) or by title/year.
 * OMDb is optional enrichment — any failure resolves to null and the
 * caller continues with TMDB-only data.
 */
export async function getOmdbEnrichment(input: {
  imdbId?: string | null;
  title?: string;
  year?: number;
}): Promise<OmdbEnrichment | null> {
  const params = input.imdbId
    ? { i: input.imdbId }
    : input.title
      ? { t: input.title, y: input.year }
      : null;
  if (!params) return null;

  const data = await omdbGet<OmdbTitleResponse>({ ...params, plot: "short" });
  if (!data || data.Response !== "True") return null;

  const rating =
    data.Ratings?.find((r) => r.Source === "Internet Movie Database")?.Value ??
    (data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : undefined);

  return {
    imdbRating: rating ?? undefined,
    metascore:
      data.Metascore && data.Metascore !== "N/A" ? data.Metascore : undefined,
    rated: data.Rated !== "N/A" ? data.Rated : undefined,
  };
}

export function parseOmdbRuntime(runtime?: string) {
  return parseRuntime(runtime);
}
