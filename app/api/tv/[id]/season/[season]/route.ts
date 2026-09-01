import type { NextRequest } from "next/server";
import { getTVSeason } from "@/lib/tmdb/client";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { idParamSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/tv/[id]/season/[season]">) {
  try {
    const { id, season } = await ctx.params;
    const idParsed = idParamSchema.safeParse(id);
    const seasonParsed = idParamSchema.safeParse(season);
    if (!idParsed.success || !seasonParsed.success) return jsonError("Invalid tv/season id", 400);
    const data = await getTVSeason(idParsed.data, seasonParsed.data);
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}
