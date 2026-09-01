import type { NextRequest } from "next/server";
import { getProviders } from "@/lib/tmdb/client";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get("country") ?? "US";
    const providers = await getProviders(country);
    return jsonOk({ country, providers });
  } catch (error) {
    return handleApiError(error);
  }
}
