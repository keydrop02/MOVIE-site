import { NextResponse } from "next/server";
import {
  search,
  searchAllMedia,
  searchMovies,
  searchPeople,
  searchQuick,
  searchTvShows,
} from "@/lib/api/search";

export const dynamic = "force-dynamic";

const EMPTY_GROUPS = {
  movies: [],
  tv: [],
  people: [],
  page: 1,
  totalPages: 0,
  totalResults: 0,
};

const CACHE_HEADER = "s-maxage=30, stale-while-revalidate=60";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const pageRaw = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 500) : 1;
  const type = url.searchParams.get("type");

  if (!query) {
    return NextResponse.json(EMPTY_GROUPS, {
      headers: { "cache-control": "no-store" },
    });
  }

  try {
    // Single-section mode: one type's own pagination stream.
    if (type === "movie" || type === "tv" || type === "person") {
      const section =
        type === "movie"
          ? await searchMovies(query, page)
          : type === "tv"
            ? await searchTvShows(query, page)
            : await searchPeople(query, page);
      return NextResponse.json(section, {
        headers: { "cache-control": CACHE_HEADER },
      });
    }

    // Combined movie+TV mode for the /search page grid.
    if (type === "all") {
      const combined = await searchAllMedia(query, page);
      return NextResponse.json(combined, {
        headers: { "cache-control": CACHE_HEADER },
      });
    }

    // Overlay: use single-endpoint searchMulti for speed.
    if (type === "quick") {
      const quick = await searchQuick(query, page);
      return NextResponse.json(quick, {
        headers: { "cache-control": CACHE_HEADER },
      });
    }

    const groups = await search(query, page);
    return NextResponse.json(groups, {
      headers: { "cache-control": CACHE_HEADER },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ApiConfigError") {
      console.error("[api/search] config error:", error.message);
      return NextResponse.json(
        { error: "search_unconfigured" },
        { status: 503, headers: { "cache-control": "no-store" } }
      );
    }
    console.error(
      "[api/search] failed:",
      error instanceof Error ? error.stack : error
    );
    return NextResponse.json(
      { error: "search_failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
