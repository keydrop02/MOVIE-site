import type { Metadata } from "next";
import { discoverMovies, discoverTV, getGenres } from "@/lib/tmdb/client";
import { AnimeBrowser } from "@/components/media/anime-browser";
import { ANIME_KEYWORD } from "@/lib/constants";

export const metadata: Metadata = { title: "Anime" };
export const revalidate = 1800;

export default async function AnimePage({ searchParams }: PageProps<"/anime">) {
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const genre = sp.genre ? Number(sp.genre) : undefined;
  const page = Number(sp.page ?? "1");
  const sortBy = str(sp.sort) ?? undefined;
  const language = str(sp.language);
  const country = str(sp.country);

  const [tvData, movieData, movieGenres, tvGenres] = await Promise.all([
    discoverTV({
      keywords: [ANIME_KEYWORD],
      genreIds: genre ? [genre] : undefined,
      sortBy: sortBy ?? "popularity.desc",
      language: language ?? undefined,
      country: country ?? undefined,
      minRating: sp.rating ? Number(sp.rating) : undefined,
      year: sp.year ? Number(sp.year) : undefined,
      page,
    }).catch(() => ({ results: [], totalPages: 1, totalResults: 0, page: 1 })),
    discoverMovies({
      keywords: [ANIME_KEYWORD],
      genreIds: genre ? [genre] : undefined,
      sortBy: sortBy ?? "popularity.desc",
      language: language ?? undefined,
      country: country ?? undefined,
      minRating: sp.rating ? Number(sp.rating) : undefined,
      year: sp.year ? Number(sp.year) : undefined,
      page,
    }).catch(() => ({ results: [], totalPages: 1, totalResults: 0, page: 1 })),
    getGenres("movie").catch(() => []),
    getGenres("tv").catch(() => []),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Anime
        </h1>
        <p className="mt-1 text-sm text-muted">
          {(tvData.totalResults + movieData.totalResults).toLocaleString()} titles to explore
        </p>
      </header>

      <AnimeBrowser
        animeKeyword={ANIME_KEYWORD}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
        initialFilters={{
          genre,
          year: sp.year ? Number(sp.year) : undefined,
          rating: sp.rating ? Number(sp.rating) : undefined,
          country,
          language,
          sort: sortBy,
        }}
        movieInitial={movieData.results}
        movieInitialTotalPages={movieData.totalPages}
        tvInitial={tvData.results}
        tvInitialTotalPages={tvData.totalPages}
      />
    </div>
  );
}
