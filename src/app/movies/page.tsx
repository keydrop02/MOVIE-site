import type { Metadata } from "next";
import { getMovieGenres } from "@/lib/api/genres";
import {
  discoverMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
} from "@/lib/api/movies";
import type { MediaItem, Paginated } from "@/lib/api/types";
import { toNumberParam, toStringParam } from "@/lib/utils";
import { CatalogView } from "@/components/catalog-view";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Movies",
  description:
    "Browse popular, top rated, in-theaters, and upcoming movies with rich artwork and ratings.",
  alternates: { canonical: "/movies" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const OPTIONS = [
  { key: "popular", label: "Popular" },
  { key: "top_rated", label: "Top rated" },
  { key: "newest", label: "Newest" },
  { key: "upcoming", label: "Upcoming" },
] as const;

type SortKey = (typeof OPTIONS)[number]["key"];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 24;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

export default async function MoviesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const sortParam = toStringParam(query.sort);
  const sort: SortKey = OPTIONS.some((o) => o.key === sortParam)
    ? (sortParam as SortKey)
    : "popular";
  const page = Math.min(toNumberParam(query.page) ?? 1, 500);

  const genres = await getMovieGenres().catch(() => []);
  const genreParam = toNumberParam(query.genre);
  const activeGenre = genres.some((g) => g.id === genreParam) ? genreParam : undefined;
  const yearParam = toNumberParam(query.year);
  const activeYear =
    yearParam && yearParam >= MIN_YEAR && yearParam <= CURRENT_YEAR ? yearParam : undefined;

  const baseLoaders: Record<
    SortKey,
    (p: number) => Promise<Paginated<MediaItem>>
  > = {
    popular: (p) => getPopularMovies(p),
    top_rated: (p) => getTopRatedMovies(p),
    newest: (p) =>
      discoverMovies({
        page: p,
        sort_by: "primary_release_date.desc",
        "vote_count.gte": 50,
      }),
    upcoming: (p) => getUpcomingMovies(p),
  };

  const loader = (): Promise<Paginated<MediaItem>> => {
    if (!activeGenre && !activeYear) return baseLoaders[sort](page);
    const sortBy =
      sort === "top_rated"
        ? "vote_average.desc"
        : sort === "newest"
          ? "primary_release_date.desc"
          : "popularity.desc";
    const today = new Date().toISOString().slice(0, 10);
    return discoverMovies({
      page,
      sort_by: sortBy,
      ...(sort === "top_rated" ? { "vote_count.gte": 200 } : {}),
      ...(sort === "newest" ? { "vote_count.gte": 50 } : {}),
      ...(sort === "upcoming" ? { "primary_release_date.gte": today } : {}),
      ...(activeGenre ? { with_genres: String(activeGenre) } : {}),
      ...(activeYear
        ? {
            "primary_release_date.gte": `${activeYear}-01-01`,
            "primary_release_date.lte": `${activeYear}-12-31`,
          }
        : {}),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CatalogView
        title="Movies"
        tagline="Thousands of films — from blockbusters in theaters to all-time classics."
        basePath="/movies"
        options={[...OPTIONS]}
        activeKey={sort}
        page={page}
        loader={loader}
        filters={{ genres, years: YEARS, activeGenre, activeYear }}
      />
    </div>
  );
}
