import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { discoverMovies, discoverTV, getGenres, getAllGenres } from "@/lib/tmdb/client";
import { MediaGrid } from "@/components/media/media-grid";
import { Pagination } from "@/components/media/pagination";

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/genre/[id]">): Promise<Metadata> {
  const { id } = await params;
  const all = await getAllGenres().catch(() => ({ movie: [], tv: [] }));
  const found = [...all.movie, ...all.tv].find((g) => g.id === Number(id));
  return { title: found?.name ? `Genre: ${found.name}` : "Genre" };
}

export default async function GenrePage({ params, searchParams }: PageProps<"/genre/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const genreId = Number(id);
  const type = sp.type === "tv" ? "tv" : "movie";
  const page = Number(sp.page ?? "1");

  const [genreList, allGenres] = await Promise.all([
    getGenres(type),
    getAllGenres().catch(() => ({ movie: [], tv: [] })),
  ]);
  const genre = genreList.find((g) => g.id === genreId) ?? allGenres[type].find((g) => g.id === genreId);
  if (!genre) notFound();

  const data =
    type === "tv"
      ? await discoverTV({ genreIds: [genreId], sortBy: "popularity.desc", page })
      : await discoverMovies({ genreIds: [genreId], sortBy: "popularity.desc", page });

  const totalPages = data.totalPages > 0 ? data.totalPages : 1;
  const buildHref = (p: number) =>
    `/genre/${genreId}?type=${type}&page=${p}`;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {genre.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {type === "tv" ? "TV Shows" : "Movies"} · {data.totalResults.toLocaleString()} titles
        </p>
      </header>

      <MediaGrid items={data.results} />
      <Pagination currentPage={data.page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
