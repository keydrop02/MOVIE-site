import type { NextRequest } from "next/server";
import { getMovie } from "@/lib/tmdb/client";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { idParamSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/movie/[id]">) {
  try {
    const { id } = await ctx.params;
    const parsed = idParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("Invalid movie id", 400);
    const movie = await getMovie(parsed.data);
    return jsonOk(movie);
  } catch (error) {
    return handleApiError(error);
  }
}
