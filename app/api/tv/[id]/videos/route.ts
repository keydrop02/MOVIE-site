import type { NextRequest } from "next/server";
import { getTVVideos } from "@/lib/tmdb/client";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { idParamSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/tv/[id]/videos">) {
  try {
    const { id } = await ctx.params;
    const parsed = idParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("Invalid tv id", 400);
    const videos = await getTVVideos(parsed.data);
    return jsonOk(videos);
  } catch (error) {
    return handleApiError(error);
  }
}
