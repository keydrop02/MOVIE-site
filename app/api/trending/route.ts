import type { NextRequest } from "next/server";
import { getTrendingMovies, getTrendingTV } from "@/lib/tmdb/client";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const window = sp.get("window") === "day" ? "day" : "week";
    const type = sp.get("type") ?? "all";
    const movies = type === "all" || type === "movie" ? await getTrendingMovies(window) : [];
    const tv = type === "all" || type === "tv" ? await getTrendingTV(window) : [];
    return jsonOk({ window, movies, tv });
  } catch (error) {
    return handleApiError(error);
  }
}
