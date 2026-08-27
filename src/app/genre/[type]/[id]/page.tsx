import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { browseGenre, getMovieGenres, getTvGenres } from "@/lib/api/genres";
import type { CatalogSort } from "@/lib/api/genres";
import { toNumberParam, toStringParam } from "@/lib/utils";
import { MediaGrid } from "@/components/media-grid";
import { GridSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORTS: { key: CatalogSort; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "top_rated", label: "Top Rated" },
  { key: "latest", label: "Latest" },
];

function parseParams(
  rawType: string,
  rawId: string
): { type: "movie" | "tv"; id: number } | null {
  if (rawType !== "movie" && rawType !== "tv") return null;
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: rawType, id };
}

async function getGenreName(type: "movie" | "tv", id: number) {
  const genres = type === "movie" ? await getMovieGenres() : await getTvGenres();
  return genres.find((genre) => genre.id === id)?.name ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const raw = await params;
  const parsed = parseParams(raw.type, raw.id);
  if (!parsed) return {};
  try {
    const name = await getGenreName(parsed.type, parsed.id);
    if (!name) {
      return { title: "Browse" };
    }
    return {
      title: `${name} ${parsed.type === "movie" ? "Movies" : "TV Shows"}`,
      description: `Browse the best ${name} ${parsed.type === "movie" ? "movies" : "TV shows"} — popular, top rated, and latest releases.`,
      alternates: { canonical: `/genre/${parsed.type}/${parsed.id}` },
    };
  } catch {
    return { title: "Browse" };
  }
}

async function GenreContent({
  type,
  id,
  sort,
  page,
}: {
  type: "movie" | "tv";
  id: number;
  sort: CatalogSort;
  page: number;
}) {
  let genreName: string | null = null;
  let result;
  try {
    [genreName, result] = await Promise.all([getGenreName(type, id), browseGenre(type, id, sort, page)]);
  } catch {
    return <ErrorState />;
  }

  if (!result.items.length) {
    return (
      <EmptyState
        title="No titles found"
        message="This category doesn't have any titles for the selected filter right now."
      />
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {genreName ?? "Browse"}{" "}
        <span className="text-muted">{type === "movie" ? "Movies" : "TV Shows"}</span>
      </h1>

      <nav aria-label="Filters" className="mt-5 flex gap-2">
        {SORTS.map((option) => (
          <Link
            key={option.key}
            href={`/genre/${type}/${id}?sort=${option.key}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              option.key === sort
                ? "border-gold bg-surface text-gold"
                : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <MediaGrid items={result.items} />
      </div>

      <Pagination
        page={page}
        totalPages={result.totalPages}
        basePath={`/genre/${type}/${id}`}
        searchParams={{ sort }}
      />
    </>
  );
}

export default async function GenrePage({ params, searchParams }: PageProps) {
  const [raw, query] = await Promise.all([params, searchParams]);
  const parsed = parseParams(raw.type, raw.id);
  if (!parsed) notFound();

  const sortParam = toStringParam(query.sort);
  const sort: CatalogSort =
    sortParam === "top_rated" || sortParam === "latest" ? sortParam : "popular";
  const page = Math.min(toNumberParam(query.page) ?? 1, 500);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton count={12} />}>
        <GenreContent type={parsed.type} id={parsed.id} sort={sort} page={page} />
      </Suspense>
    </div>
  );
}
