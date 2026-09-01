import type { NextRequest } from "next/server";
import { getAllGenres, getGenres } from "@/lib/tmdb/client";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const type = sp.get("type");
    if (type === "movie" || type === "tv") {
      return jsonOk({ movie: type === "movie" ? await getGenres("movie") : [], tv: type === "tv" ? await getGenres("tv") : [] });
    }
    return jsonOk(await getAllGenres());
  } catch (error) {
    return handleApiError(error);
  }
}
