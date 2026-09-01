import {
  getTrendingMedia,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
  getProviders,
  getAllGenres,
  getMovieLogo,
  getTVLogo,
  discoverTV,
  discoverMovies,
} from "@/lib/tmdb/client";
import { HeroCarousel } from "@/components/hero/hero-carousel";
import { HeroSkeleton } from "@/components/hero/hero-skeleton";
import { ProviderRail } from "@/components/rails/provider-rail";
import { MediaRail } from "@/components/rails/media-rail";
import { ContinueWatchingRail } from "@/components/rails/continue-watching-rail";
import { SPOTLIGHT_PROVIDERS, ANIME_KEYWORD } from "@/lib/constants";
import type { Media } from "@/lib/tmdb/types";

export const revalidate = 1800;

export default async function HomePage() {
  const [trending, popularMovies, popularTV, topRatedMovies, topRatedTV, providers, genreLists, animePopMovies, animePopTV, animeTopMovies, animeTopTV] =
    await Promise.all([
      getTrendingMedia("week", 20).catch(() => []),
      getPopularMovies(1).catch(() => []),
      getPopularTV(1).catch(() => []),
      getTopRatedMovies(1).catch(() => []),
      getTopRatedTV(1).catch(() => []),
      getProviders("US").catch(() => []),
      getAllGenres().catch(() => ({ movie: [], tv: [] })),
      discoverMovies({ keywords: [ANIME_KEYWORD], sortBy: "popularity.desc", page: 1 }).catch(
        () => ({ results: [], totalPages: 0, totalResults: 0, page: 1 })
      ),
      discoverTV({ keywords: [ANIME_KEYWORD], sortBy: "popularity.desc", page: 1 }).catch(() => ({
        results: [],
        totalPages: 0,
        totalResults: 0,
        page: 1,
      })),
      discoverMovies({ keywords: [ANIME_KEYWORD], sortBy: "vote_average.desc", page: 1 }).catch(
        () => ({ results: [], totalPages: 0, totalResults: 0, page: 1 })
      ),
      discoverTV({ keywords: [ANIME_KEYWORD], sortBy: "vote_average.desc", page: 1 }).catch(() => ({
        results: [],
        totalPages: 0,
        totalResults: 0,
        page: 1,
      })),
    ]);

  const interleaveAnime = (movies: Media[], tv: Media[]) => {
    const seen = new Set<string>();
    const out: Media[] = [];
    const max = Math.max(movies.length, tv.length);
    for (let i = 0; i < max; i++) {
      for (const arr of [movies, tv]) {
        const item = arr[i];
        if (!item) continue;
        const key = `${item.type}-${item.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ ...item, isAnime: true });
        }
      }
    }
    return out;
  };

  const animeStamped = interleaveAnime(animePopMovies.results, animePopTV.results);
  const topAnimeStamped = interleaveAnime(animeTopMovies.results, animeTopTV.results);

  const genreName = new Map<number, string>();
  genreLists.movie.forEach((g) => genreName.set(g.id, g.name));
  genreLists.tv.forEach((g) => genreName.set(g.id, g.name));

  const trendingWithGenres = trending.slice(0, 6).map((m) => ({
    ...m,
    genres: m.genreIds
      .map((id) => ({ id, name: genreName.get(id) ?? "" }))
      .filter((g) => g.name),
  }));

  const trendingWithLogos = await Promise.all(
    trendingWithGenres.map(async (m) => {
      const logo =
        m.type === "movie"
          ? await getMovieLogo(m.id).catch(() => null)
          : await getTVLogo(m.id).catch(() => null);
      return { ...m, logo };
    })
  );

  const spotlight = providers.filter((p) => SPOTLIGHT_PROVIDERS[String(p.provider_id)]);

  return (
    <div>
      <HeroCarousel items={trendingWithLogos} />

      <ProviderRail providers={spotlight} className="pt-6" />

      <ContinueWatchingRail />

      <MediaRail
        title="Trending Now"
        items={trending}
      />
      <MediaRail
        title="Popular Movies"
        items={popularMovies}
        viewAllHref="/movies?sort=popularity.desc"
      />
      <MediaRail
        title="Popular TV Shows"
        items={popularTV}
        viewAllHref="/tv?sort=popularity.desc"
      />
      <MediaRail
        title="Top Rated Movies"
        items={topRatedMovies}
        viewAllHref="/movies?sort=vote_average.desc"
      />
      <MediaRail
        title="Top Rated TV Shows"
        items={topRatedTV}
        viewAllHref="/tv?sort=vote_average.desc"
      />
      <MediaRail
        title="Popular Anime"
        items={animeStamped.slice(0, 20)}
        viewAllHref={`/anime?sort=popularity.desc`}
      />
      <MediaRail
        title="Top Rated Anime"
        items={topAnimeStamped.slice(0, 20)}
        viewAllHref={`/anime?sort=vote_average.desc`}
      />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div>
      <HeroSkeleton />
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-6 md:px-10">
        <div className="mb-3 h-7 w-48 animate-pulse rounded bg-white/[0.06]" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 w-32 flex-none animate-pulse rounded-2xl bg-white/[0.05]" />
          ))}
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="py-5 sm:py-6">
          <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
            <div className="mb-3 h-7 w-48 animate-pulse rounded bg-white/[0.06]" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="h-56 w-[170px] flex-none animate-pulse rounded-2xl bg-white/[0.05]" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
