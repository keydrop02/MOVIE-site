import type { Metadata } from "next";
import { getTvGenres } from "@/lib/api/genres";
import { discoverSeries, getPopularTv, getTopRatedTv } from "@/lib/api/tv";
import type { MediaItem, Paginated } from "@/lib/api/types";
import { toNumberParam, toStringParam } from "@/lib/utils";
import { CatalogView } from "@/components/catalog-view";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "TV Shows",
  description:
    "Browse popular, top rated, and currently airing TV shows with rich artwork and ratings.",
  alternates: { canonical: "/tv" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const OPTIONS = [
  { key: "popular", label: "Popular" },
  { key: "top_rated", label: "Top rated" },
  { key: "newest", label: "Newest" },
] as const;

type SortKey = (typeof OPTIONS)[number]["key"];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 24;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

export default async function TvCatalogPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const sortParam = toStringParam(query.sort);
  const sort: SortKey = OPTIONS.some((o) => o.key === sortParam)
    ? (sortParam as SortKey)
    : "popular";
  const page = Math.min(toNumberParam(query.page) ?? 1, 500);

  const genres = await getTvGenres().catch(() => []);
  const genreParam = toNumberParam(query.genre);
  const activeGenre = genres.some((g) => g.id === genreParam) ? genreParam : undefined;
  const yearParam = toNumberParam(query.year);
  const activeYear =
    yearParam && yearParam >= MIN_YEAR && yearParam <= CURRENT_YEAR ? yearParam : undefined;

  const baseLoaders: Record<
    SortKey,
    (p: number) => Promise<Paginated<MediaItem>>
  > = {
    popular: (p) => getPopularTv(p),
    top_rated: (p) => getTopRatedTv(p),
    newest: (p) =>
      discoverSeries({
        page: p,
        sort_by: "first_air_date.desc",
        "vote_count.gte": 50,
      }),
  };

  const loader = (): Promise<Paginated<MediaItem>> => {
    if (!activeGenre && !activeYear) return baseLoaders[sort](page);
    const sortBy =
      sort === "top_rated"
        ? "vote_average.desc"
        : sort === "newest"
          ? "first_air_date.desc"
          : "popularity.desc";
    return discoverSeries({
      page,
      sort_by: sortBy,
      ...(sort !== "popular" ? { "vote_count.gte": sort === "top_rated" ? 200 : 50 } : {}),
      ...(activeGenre ? { with_genres: String(activeGenre) } : {}),
      ...(activeYear
        ? {
            "first_air_date.gte": `${activeYear}-01-01`,
            "first_air_date.lte": `${activeYear}-12-31`,
          }
        : {}),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CatalogView
        title="TV Shows"
        tagline="Binge-worthy series and daily airings across every genre."
        basePath="/tv"
        options={[...OPTIONS]}
        activeKey={sort}
        page={page}
        loader={loader}
        filters={{ genres, years: YEARS, activeGenre, activeYear }}
      />
    </div>
  );
}
