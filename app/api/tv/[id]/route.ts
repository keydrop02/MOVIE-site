import type { NextRequest } from "next/server";
import { getTV } from "@/lib/tmdb/client";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { idParamSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/tv/[id]">) {
  try {
    const { id } = await ctx.params;
    const parsed = idParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("Invalid tv id", 400);
    const tv = await getTV(parsed.data);
    return jsonOk(tv);
  } catch (error) {
    return handleApiError(error);
  }
}
