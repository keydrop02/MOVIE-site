import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTrendingMixed } from "@/lib/api/trending";
import { getTrendingMovies, getTrendingTv } from "@/lib/api/trending";
import { toStringParam } from "@/lib/utils";
import type { MediaItem } from "@/lib/api/types";
import { MediaGrid } from "@/components/media-grid";
import { GridSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";

export const revalidate = 1800;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const WINDOWS = [
  { key: "day", label: "Today" },
  { key: "week", label: "This Week" },
] as const;

type Window = (typeof WINDOWS)[number]["key"];

const TYPES = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movies" },
  { key: "tv", label: "TV" },
] as const;

type TrendingType = (typeof TYPES)[number]["key"];

async function Results({ window, type }: { window: Window; type: TrendingType }) {
  let items: MediaItem[];
  try {
    if (type === "movie") items = await getTrendingMovies(window);
    else if (type === "tv") items = await getTrendingTv(window);
    else items = (await getTrendingMixed(window)).items;
  } catch {
    return <ErrorState />;
  }

  return <MediaGrid items={items} />;
}

function TabBar({
  window,
  type,
}: {
  window: Window;
  type: TrendingType;
}) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex gap-2" role="group" aria-label="Time window">
        {WINDOWS.map((option) => (
          <Link
            key={option.key}
            href={`/trending?window=${option.key}&type=${type}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              option.key === window
                ? "border-gold bg-surface text-gold"
                : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-2" role="group" aria-label="Media type">
        {TYPES.map((option) => (
          <Link
            key={option.key}
            href={`/trending?window=${window}&type=${option.key}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              option.key === type
                ? "border-gold bg-surface text-gold"
                : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Trending",
  description:
    "What's trending right now across movies and TV — updated daily and weekly.",
  alternates: { canonical: "/trending" },
};

export default async function TrendingPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const windowParam = toStringParam(query.window);
  const typeParam = toStringParam(query.type);
  const window: Window =
    windowParam === "day" || windowParam === "week" ? windowParam : "week";
  const type: TrendingType =
    typeParam === "movie" || typeParam === "tv" ? typeParam : "all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trending</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        The most watched titles on Movieo right now, straight from live data.
      </p>

      <div className="mt-6">
        <TabBar window={window} type={type} />
      </div>

      <div className="mt-8">
        <Suspense fallback={<GridSkeleton count={12} />}>
          <Results window={window} type={type} />
        </Suspense>
      </div>
    </div>
  );
}
