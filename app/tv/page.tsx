import type { Metadata } from "next";
import { discoverTV, getGenres } from "@/lib/tmdb/client";
import { DiscoverBrowser } from "@/components/media/discover-browser";

export const metadata: Metadata = { title: "TV Shows" };
export const revalidate = 1800;

export default async function TVPage({ searchParams }: PageProps<"/tv">) {
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const genre = sp.genre ? Number(sp.genre) : undefined;
  const page = Number(sp.page ?? "1");
  const sortBy = str(sp.sort) ?? undefined;
  const language = str(sp.language);
  const country = str(sp.country);

  const genreList = await getGenres("tv");

  const data = await discoverTV({
    genreIds: genre ? [genre] : undefined,
    sortBy: sortBy ?? "popularity.desc",
    language: language ?? undefined,
    country: country ?? undefined,
    minRating: sp.rating ? Number(sp.rating) : undefined,
    year: sp.year ? Number(sp.year) : undefined,
    page,
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          TV Shows
        </h1>
        <p className="mt-1 text-sm text-muted">
          {data.totalResults.toLocaleString()} titles to explore
        </p>
      </header>

      <DiscoverBrowser
        type="tv"
        genres={genreList}
        initialFilters={{
          genre,
          year: sp.year ? Number(sp.year) : undefined,
          rating: sp.rating ? Number(sp.rating) : undefined,
          country,
          language,
          sort: sortBy,
        }}
        initial={data.results}
        initialTotalPages={data.totalPages}
      />
    </div>
  );
}
