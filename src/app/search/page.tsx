import type { Metadata } from "next";
import { toStringParam } from "@/lib/utils";
import { searchAllMedia, type AllMediaResults } from "@/lib/api/search";
import { SearchExperience } from "@/components/search-experience";

export const metadata: Metadata = {
  title: "Search",
  description: "Search movies and TV shows.",
  alternates: { canonical: "/search" },
  robots: { index: false },
};

const EMPTY_RESULTS: AllMediaResults = {
  items: [],
  sections: {
    movie: { page: 1, totalPages: 0 },
    tv: { page: 1, totalPages: 0 },
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = toStringParam((await searchParams).q) ?? "";

  let initialResults: AllMediaResults = EMPTY_RESULTS;

  if (query) {
    try {
      initialResults = await searchAllMedia(query);
    } catch {
      /* the client experience surfaces retry UI on failure */
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="sr-only">Search</h1>
      <SearchExperience initialQuery={query} initialResults={initialResults} />
    </div>
  );
}
