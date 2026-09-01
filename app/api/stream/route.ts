import { NextResponse } from "next/server";

const PLAYER_THEME = {
  player_font: "Inter",
  player_bg_color: "020b07",
  player_font_color: "f5f5f5",
  player_primary_color: "9fd95b",
  player_secondary_color: "b6e57a",
  player_loader: "1",
  preferred_server: "0",
  player_sources_toggle_type: "2",
} as const;

export const dynamic = "force-dynamic";

const RESOLVE_ERROR = new NextResponse("Resolve service unavailable", { status: 502 });
const MISSING_ID = new NextResponse("Missing video_id", { status: 400 });

/**
 * GET /api/stream?video_id={tmdbId}&tmdb=1[&s=&e=]
 *
 * Fallback themed player for the SuperEmbed integration. Mimics superembed's
 * se_player.php ("advanced way"): resolves a themed player URL via
 * getsuperembed.link and redirects to it.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("video_id")?.trim();
  if (!videoId) return MISSING_ID;

  const tmdb = searchParams.get("tmdb") ?? "0";
  const season = searchParams.get("season") ?? searchParams.get("s") ?? "0";
  const episode = searchParams.get("episode") ?? searchParams.get("e") ?? "0";

  const resolveUrl = new URL("https://getsuperembed.link/");
  resolveUrl.searchParams.set("video_id", videoId);
  resolveUrl.searchParams.set("tmdb", tmdb);
  resolveUrl.searchParams.set("season", season);
  resolveUrl.searchParams.set("episode", episode);
  for (const [key, value] of Object.entries(PLAYER_THEME)) {
    resolveUrl.searchParams.set(key, value);
  }

  let body: string;
  try {
    const res = await fetch(resolveUrl.toString(), {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return RESOLVE_ERROR;
    body = await res.text();
  } catch {
    return RESOLVE_ERROR;
  }

  const target = body.match(/https:\/\/\S+/);
  if (target) return NextResponse.redirect(target[0], 307);

  const message = body.trim() || "Request server didn't respond";
  return new NextResponse(message, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}