import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getMovie } from "@/lib/api/movies";
import type { MediaDetails } from "@/lib/api/types";
import { MovieView, movieMetadata } from "@/components/detail-views";

export const revalidate = 21600;

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function loadMovieUncached(id: string): Promise<MediaDetails> {
  const parsed = parseId(id);
  if (!parsed) notFound();
  try {
    return await getMovie(parsed);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// Deduped per request so generateMetadata + page share one upstream fetch.
const loadMovie = cache(loadMovieUncached);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // Intentionally unguarded: a missing title throws notFound() here, which
  // lets Next respond with a proper 404 status before streaming begins.
  const movie = await loadMovie(id);
  return movieMetadata(movie, id);
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  const movie = await loadMovie(id);
  return <MovieView movie={movie} />;
}
