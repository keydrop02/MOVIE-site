import type { NextRequest } from "next/server";
import { discoverMovies } from "@/lib/tmdb/client";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const keywords = sp
      .get("keywords")
      ?.split(",")
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
    const providers = sp
      .get("providers")
      ?.split(",")
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
    const result = await discoverMovies({
      genreIds: sp.get("genre") ? [Number(sp.get("genre"))] : undefined,
      keywords: keywords?.length ? keywords : undefined,
      providers: providers?.length ? providers : undefined,
      year: sp.get("year") ? Number(sp.get("year")) : undefined,
      sortBy: sp.get("sort") ?? undefined,
      minRating: sp.get("rating") ? Number(sp.get("rating")) : undefined,
      minVoteCount: sp.get("minVotes") ? Number(sp.get("minVotes")) : undefined,
      language: sp.get("language") ?? undefined,
      country: sp.get("country") ?? undefined,
      page: Number(sp.get("page") ?? "1"),
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
