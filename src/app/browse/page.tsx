import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { BrowseTile } from "@/components/browse-tile";
import { GridSkeleton } from "@/components/loading-skeleton";
import { MediaCard } from "@/components/media-card";
import { BrowseFilters } from "@/components/browse-filters";
import { getMovieGenres, getTvGenres, getGenreBackdrop } from "@/lib/api/genres";
import { getDiscover } from "@/lib/api/tmdb";
import { normalizePaginated } from "@/lib/api/normalize";
import type { Genre } from "@/lib/api/types";
import {
  MOODS,
  COLLECTIONS,
  ERAS,
  getMoodGenreHref,
  getMoodBackdrop,
  getEraBackdrop,
  getCollectionBackdrop,
} from "@/lib/api/browse";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Browse",
  description:
    "Discover movies, TV shows, and anime by genre, mood, era, and more.",
  alternates: { canonical: "/browse" },
};

async function GenreGrid() {
  let genres;
  try {
    genres = await getMovieGenres();
  } catch {
    return null;
  }
  if (!genres.length) return null;

  const backdrops = await Promise.all(
    genres.map((g) => getGenreBackdrop(g.id).catch(() => undefined))
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {genres.map((genre, i) => (
        <Link
          key={genre.id}
          href={`/genre/movie/${genre.id}`}
          className="group relative block aspect-[5/2] overflow-hidden rounded-card border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          {backdrops[i] && (
            // eslint-disable-next-line @next/next/no-img-element -- simple backdrop tile
            <img
              src={`https://image.tmdb.org/t/p/w300${backdrops[i]}`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-75"
              loading="lazy"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent"
          />
          <span className="absolute bottom-3 left-4 font-semibold tracking-tight text-foreground drop-shadow">
            {genre.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

const SORT_MAP: Record<string, string | undefined> = {
  popular: "popularity.desc",
  top_rated: "vote_average.desc",
  latest: "primary_release_date.desc",
};

async function FilteredBrowse({
  type,
  genreId,
  sort,
  year,
}: {
  type: "movie" | "tv";
  genreId?: number;
  sort?: string;
  year?: number;
}) {
  try {
    const params: import("@/lib/api/tmdb").DiscoverParams = {};
    if (genreId) params.with_genres = String(genreId);
    if (sort) params.sort_by = SORT_MAP[sort] ?? sort;
    if (year) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      if (type === "movie") {
        params["primary_release_date.gte"] = start;
        params["primary_release_date.lte"] = end;
      } else {
        params["first_air_date.gte"] = start;
        params["first_air_date.lte"] = end;
      }
    }

    const raw = await getDiscover(type, params);
    const { items, totalResults } = normalizePaginated(raw, type);

    return items.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={`Filtered Results — ${totalResults.toLocaleString()} titles`} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} className="w-full" />
          ))}
        </div>
      </section>
    ) : (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="No Results" />
        <p className="text-sm text-muted">
          No items match your current filters. Try adjusting your selection.
        </p>
      </section>
    );
  } catch {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Could Not Load Results" />
        <p className="text-sm text-muted">
          Something went wrong fetching filtered content. Try again shortly.
        </p>
      </section>
    );
  }
}

export default async function BrowsePage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const type = searchParams?.type as "movie" | "tv" | undefined;
  const genre = searchParams?.genre;
  const sort = searchParams?.sort;
  const year = searchParams?.year;
  const hasFilters = Boolean(type || genre || sort || year);

  let genres: Genre[] = [];
  try {
    const [movieGenres, tvGenres] = await Promise.all([getMovieGenres(), getTvGenres()]);
    const seen = new Set<number>();
    for (const g of [...movieGenres, ...tvGenres]) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        genres.push(g);
      }
    }
  } catch {
    genres = [];
  }

  const [moodBackdrops, eraBackdrops, collectionBackdrops] =
    await Promise.all([
      Promise.all(MOODS.map((m) => getMoodBackdrop(m).catch(() => undefined))),
      Promise.all(ERAS.map((e) => getEraBackdrop(e).catch(() => undefined))),
      Promise.all(COLLECTIONS.map((c) => getCollectionBackdrop(c).catch(() => undefined))),
    ]);

  return (
    <div className="space-y-16 pt-8 md:space-y-20">
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Browse</h1>
        <Suspense fallback={<div className="h-8" />}>
          <BrowseFilters genres={genres} />
        </Suspense>
      </header>

      {hasFilters ? (
        <FilteredBrowse
          type={type!}
          genreId={genre ? Number(genre) : undefined}
          sort={sort}
          year={year ? Number(year) : undefined}
        />
      ) : (
        <>
          {/* ── Genre Grid ── */}
          <section
            id="explore-genres"
            className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
          >
            <SectionHeader title="Explore by Genre" />
            <GridSkeleton count={12} className="sm:hidden" />
            <div className="hidden sm:block">
              <GenreGrid />
            </div>
          </section>

          {/* ── Browse by Mood ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Browse by Mood" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MOODS.map((mood, i) => (
                <BrowseTile
                  key={mood.slug}
                  label={mood.label}
                  href={getMoodGenreHref(mood)}
                  backdropPath={moodBackdrops[i]}
                />
              ))}
            </div>
          </section>

          {/* ── Browse by Era ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Browse by Era" />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ERAS.map((era, i) => (
                <BrowseTile
                  key={era.slug}
                  label={era.label}
                  href={`/movies?sort=popular`}
                  backdropPath={eraBackdrops[i]}
                />
              ))}
            </div>
          </section>

          {/* ── Curated Collections ── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Curated Collections" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {COLLECTIONS.map((col, i) => (
                <BrowseTile
                  key={col.slug}
                  label={col.label}
                  href={`/genre/movie/18?sort=top_rated`}
                  backdropPath={collectionBackdrops[i]}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
