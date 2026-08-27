import type { Metadata } from "next";
import {
  getLatestAnime,
  getPopularAnime,
  getTopRatedAnime,
  getTrendingAnime,
} from "@/lib/api/anime-catalog";
import { RailSection } from "@/components/rail-section";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Anime",
  description:
    "Trending, popular, top rated, and newly released anime series and movies, powered by TMDB.",
  alternates: { canonical: "/anime" },
};

export default function AnimePage() {
  return (
    <div className="pt-8">
      <header className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Anime</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Japanese animation from TMDB — trending series and films, all-time
          favorites, and the newest seasons.
        </p>
      </header>

      <div className="space-y-12 pb-4 md:space-y-14">
        <RailSection
          title="Trending Anime"
          itemsPromise={getTrendingAnime()}
        />
        <RailSection
          title="Popular Anime"
          itemsPromise={getPopularAnime()}
        />
        <RailSection
          title="Top Rated Anime"
          itemsPromise={getTopRatedAnime()}
        />
        <RailSection
          title="New Seasons"
          itemsPromise={getLatestAnime()}
        />
      </div>
    </div>
  );
}
