import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getSeries } from "@/lib/api/tv";
import { getMovie } from "@/lib/api/movies";
import type { MediaDetails } from "@/lib/api/types";
import {
  MovieView,
  SeriesView,
  movieMetadata,
  seriesMetadata,
} from "@/components/detail-views";

export const revalidate = 21600;

type PageProps = {
  params: Promise<{ type: string; id: string }>;
};

function normalizeType(raw: string): "tv" | "movie" | null {
  return raw === "tv" || raw === "movie" ? raw : null;
}

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function loadAnimeUncached(
  kind: "tv" | "movie",
  id: string
): Promise<MediaDetails> {
  const parsed = parseId(id);
  if (!parsed) notFound();
  try {
    return await (kind === "tv" ? getSeries(parsed) : getMovie(parsed));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// Deduped per request so generateMetadata + page share one upstream fetch.
const loadAnime = cache(loadAnimeUncached);

/**
 * Anime entry points into the standard TMDB detail views. Rendering and data
 * are identical to `/tv/[id]` and `/movie/[id]`; canonical URLs keep pointing
 * at the standard routes.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, id } = await params;
  const kind = normalizeType(type);
  if (!kind) notFound();
  // A missing title throws notFound() inside the loader, producing a proper
  // 404 status before streaming begins.
  const item = await loadAnime(kind, id);
  return kind === "tv"
    ? seriesMetadata(item, id, "Anime")
    : movieMetadata(item, id, "Anime");
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const kind = normalizeType(type);
  if (!kind) notFound();
  const item = await loadAnime(kind, id);
  return kind === "tv" ? (
    <SeriesView series={item} useAnimeRoutes />
  ) : (
    <MovieView movie={item} useAnimeRoutes />
  );
}
