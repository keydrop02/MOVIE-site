import type { NextRequest } from "next/server";
import { getMovieRecommendations } from "@/lib/tmdb/client";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { idParamSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/movie/[id]/recommendations">) {
  try {
    const { id } = await ctx.params;
    const parsed = idParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("Invalid movie id", 400);
    const recs = await getMovieRecommendations(parsed.data);
    return jsonOk(recs);
  } catch (error) {
    return handleApiError(error);
  }
}
