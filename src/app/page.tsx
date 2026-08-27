import { Suspense } from "react";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { RailSection } from "@/components/rail-section";
import { SectionHeader } from "@/components/section-header";
import { GridSkeleton } from "@/components/loading-skeleton";
import { GenreCard } from "@/components/genre-card";
import { ContinueWatchingRail } from "@/components/continue-watching-rail";
import { getMovieGenres, getTvGenres } from "@/lib/api/genres";
import { getTrendingMixed } from "@/lib/api/trending";
import { getPopularMovies, getTopRatedMovies } from "@/lib/api/movies";
import { getPopularTv, getTopRatedTv } from "@/lib/api/tv";
import {
  getPopularAnime,
  getTopRatedAnime,
} from "@/lib/api/anime-catalog";
import type { MediaItem } from "@/lib/api/types";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Movieo — Discover your next favorite movie or show",
  description:
    "Browse trending films, popular series, top rated classics, anime, and upcoming releases.",
  alternates: { canonical: "/" },
};

const GENRE_TILE_IDS = [28, 35, 878, 27, 18, 53, 16, 10749] as const;

async function GenreGrid({ seedItems }: { seedItems: MediaItem[] }) {
  let genres;
  try {
    genres = await getMovieGenres();
  } catch {
    return null;
  }

  let fallback: MediaItem[] = [];
  try {
    fallback = await getTopRatedMovies().then((r) => r.items);
  } catch {
    fallback = [];
  }

  // Each tile claims one title exclusively: trending first, then top rated.
  const used = new Set<number>();
  const pickSeed = (id: number) =>
    seedItems.find(
      (item) =>
        !used.has(item.tmdbId) &&
        item.backdropPath &&
        item.genreIds?.includes(id)
    ) ??
    fallback.find(
      (item) =>
        !used.has(item.tmdbId) &&
        item.backdropPath &&
        item.genreIds?.includes(id)
    );

  const tiles = GENRE_TILE_IDS.map((id) => {
    const genre = genres.find((g) => g.id === id);
    if (!genre) return null;
    const seed = pickSeed(id);
    if (seed) used.add(seed.tmdbId);
    return { genre, backdrop: seed?.backdropPath ?? null };
  }).filter((tile): tile is NonNullable<typeof tile> => tile !== null);

  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map(({ genre, backdrop }) => (
        <GenreCard
          key={genre.id}
          genre={genre}
          backdropPath={backdrop}
          href={`/genre/movie/${genre.id}`}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const trendingPromise = getTrendingMixed("week");

  // Hero + genre map are needed immediately.
  const [trendingResult, movieGenresResult, tvGenresResult] =
    await Promise.allSettled([
      trendingPromise,
      getMovieGenres(),
      getTvGenres(),
    ]);

  const trending =
    trendingResult.status === "fulfilled" ? trendingResult.value.items : [];
  const genreMap: Record<number, string> = {};
  if (movieGenresResult.status === "fulfilled") {
    for (const g of movieGenresResult.value) genreMap[g.id] = g.name;
  }
  if (tvGenresResult.status === "fulfilled") {
    for (const g of tvGenresResult.value) genreMap[g.id] ??= g.name;
  }

  return (
    <>
      {trending.length > 0 ? (
        <Hero items={trending} genreMap={genreMap} />
      ) : trendingResult.status === "rejected" ? (
        <section className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">
            Movieo can&apos;t reach its data provider right now.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Please check the API configuration and try again shortly.
          </p>
        </section>
      ) : null}

      <ContinueWatchingRail />

      <div className="space-y-10 pt-10 md:space-y-12">
        <RailSection
          title="Trending This Week"
          href="/trending"
          itemsPromise={getTrendingMixed("week").then((r) => r.items)}
        />

        <RailSection
          title="Popular Movies"
          href="/movies"
          itemsPromise={getPopularMovies().then((r) => r.items)}
        />

        <RailSection
          title="Popular Series"
          href="/tv"
          itemsPromise={getPopularTv().then((r) => r.items)}
        />

        <RailSection
          title="Top Rated Movies"
          href="/movies"
          itemsPromise={getTopRatedMovies().then((r) => r.items)}
        />

        <RailSection
          title="Top Rated Series"
          href="/tv"
          itemsPromise={getTopRatedTv().then((r) => r.items)}
        />

        <RailSection
          title="Popular Anime"
          href="/anime"
          itemsPromise={getPopularAnime()}
        />

        <RailSection
          title="Top Rated Anime"
          href="/anime"
          itemsPromise={getTopRatedAnime()}
        />

        <section aria-label="Browse by genre" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Browse by Genre" />
          <Suspense fallback={<GridSkeleton count={8} />}>
            <GenreGrid seedItems={trending} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
