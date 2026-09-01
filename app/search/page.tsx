import type { Metadata } from "next";
import { SearchResults } from "@/components/search/search-results";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const type =
    sp.type === "movie" || sp.type === "tv" || sp.type === "anime" ? sp.type : "all";

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted">
          Find movies, TV shows, and anime by title or keyword.
        </p>
      </header>
      <SearchResults initialQuery={q} initialType={type} />
    </div>
  );
}
