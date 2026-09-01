import type { NextRequest } from "next/server";
import { searchMulti, discoverTV } from "@/lib/tmdb/client";
import { jsonOk, handleApiError } from "@/lib/api";
import { qSchema } from "@/lib/validation";
import { ANIME_KEYWORD } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = sp.get("query") ?? "";
    const type = sp.get("type") ?? "all";
    const page = Number(sp.get("page") ?? "1");
    qSchema.parse({ query, type, page });

    if (!query.trim()) {
      return jsonOk({ query: "", type, page: 1, results: [], totalPages: 0, totalResults: 0 });
    }

    if (type === "anime") {
      const result = await discoverTV({
        keywords: [ANIME_KEYWORD],
        withTextQuery: query,
        page,
      });
      return jsonOk({
        query,
        type,
        page: result.page,
        results: result.results,
        totalPages: result.totalPages,
        totalResults: result.totalResults,
      });
    }

    const includePerson = type === "all" || type === "person";
    const result = await searchMulti(query, page, includePerson);
    let results = result.results;
    if (type === "movie") results = results.filter((r) => r.type === "movie");
    if (type === "tv") results = results.filter((r) => r.type === "tv");

    return jsonOk({
      query,
      type,
      page: result.page,
      results,
      totalPages: result.totalPages,
      totalResults: result.totalResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
