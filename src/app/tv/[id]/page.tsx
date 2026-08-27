import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getSeries } from "@/lib/api/tv";
import type { MediaDetails } from "@/lib/api/types";
import { SeriesView, seriesMetadata } from "@/components/detail-views";

export const revalidate = 21600;

type PageProps = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function loadSeriesUncached(id: string): Promise<MediaDetails> {
  const parsed = parseId(id);
  if (!parsed) notFound();
  try {
    return await getSeries(parsed);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// Deduped per request so generateMetadata + page share one upstream fetch.
const loadSeries = cache(loadSeriesUncached);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // Intentionally unguarded: a missing title throws notFound() here, which
  // lets Next respond with a proper 404 status before streaming begins.
  const series = await loadSeries(id);
  return seriesMetadata(series, id);
}

export default async function TvPage({ params }: PageProps) {
  const { id } = await params;
  const series = await loadSeries(id);
  return <SeriesView series={series} />;
}
