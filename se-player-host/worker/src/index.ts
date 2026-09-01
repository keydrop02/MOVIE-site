/**
 * SuperEmbed self-hosted player — Cloudflare Worker equivalent of se_player.php.
 *
 * GET /se_player.php?video_id=&tmdb=&season[|s]=&episode[|e]=
 *   -> resolves the themed streamingnow.mov player via getsuperembed.link and
 *      302-redirects to it (browser then loads the full player).
 * GET /check.php
 *   -> returns a plain-text connectivity report (echo of the exact request above).
 * GET /
 *   -> simple "running" text.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Keep in sync with the theme in se_player.php / app/api/stream/route.ts.
const THEME = {
  player_font: "Inter",
  player_bg_color: "020b07",
  player_font_color: "f5f5f5",
  player_primary_color: "9fd95b",
  player_secondary_color: "b6e57a",
  player_loader: "1",
  preferred_server: "0",
  player_sources_toggle_type: "2",
} as const;

function requestUrl(url: URL): URL {
  const target = new URL("https://getsuperembed.link/");
  const videoId = (url.searchParams.get("video_id") ?? "").trim();
  const season = url.searchParams.get("season") ?? url.searchParams.get("s") ?? "0";
  const episode = url.searchParams.get("episode") ?? url.searchParams.get("e") ?? "0";
  target.searchParams.set("video_id", videoId);
  target.searchParams.set("tmdb", url.searchParams.get("tmdb") ?? "0");
  target.searchParams.set("season", String(season));
  target.searchParams.set("episode", String(episode));
  for (const [k, v] of Object.entries(THEME)) target.searchParams.set(k, v);
  return target;
}

async function fetchPlayer(target: URL): Promise<Response> {
  return fetch(target, { headers: { "user-agent": UA }, redirect: "follow" });
}

async function handlePlayer(url: URL): Promise<Response> {
  const videoId = (url.searchParams.get("video_id") ?? "").trim();
  if (!videoId) {
    return new Response("Missing video_id", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  let body = "";
  try {
    const res = await fetchPlayer(requestUrl(url));
    body = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Request failed: ${msg}`, { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const match = body.match(/https:\/\/\S+/);
  if (match) {
    return Response.redirect(match[0], 302);
  }
  const snippet = body.trim().slice(0, 500) || "Request server didn't respond";
  return new Response(snippet, {
    status: 502,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

async function handleCheck(url: URL): Promise<Response> {
  const probe = new URL(url);
  if (!probe.searchParams.get("video_id")) probe.searchParams.set("video_id", "522931");
  const target = requestUrl(probe);
  const lines: string[] = [];
  lines.push("SuperEmbed self-hosted player worker", "");
  lines.push(`Request: ${target}`, "");

  let httpCode = "n/a";
  let body = "";
  try {
    const res = await fetchPlayer(target);
    httpCode = String(res.status);
    body = await res.text();
  } catch (err) {
    lines.push(`FAIL: ${err instanceof Error ? err.message : String(err)}`, "");
    return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  lines.push(`HTTP ${httpCode}`);
  lines.push(`Body: ${body.trim().slice(0, 200) || "(empty)"}`, "");
  const match = body.match(/https:\/\/\S+/);
  if (match && match[0].includes("/?play=")) {
    lines.push(`OK: resolves the themed player -> ${match[0]}`);
  } else if (match) {
    lines.push(`WARN: returned a URL but no "?play=" token - ${match[0]}`);
  } else {
    lines.push(
      "FAIL: no player URL returned. Cloudflare may have challenged the request," +
        " or this worker cannot reach getsuperembed.link.",
    );
  }
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}

/**
 * Resolves the themed play URL for the incoming params.
 * Returns `null` when the upstream could not produce a play URL.
 */
async function resolvePlay(url: URL): Promise<string | null> {
  try {
    const res = await fetchPlayer(requestUrl(url));
    const body = await res.text();
    return body.match(/https:\/\/\S+/)?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Proxies the streamingnow.mov player page through this worker so the
 * visitor's browser frames OUR origin instead of a cross-origin page that can
 * set X-Frame-Options (Cloudflare). The frame policy is evaluated against our
 * own response, so a blocked upstream no longer breaks embedding.
 */
async function handleProxy(url: URL): Promise<Response> {
  const videoId = (url.searchParams.get("video_id") ?? "").trim();
  if (!videoId) {
    return new Response("Missing video_id", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const play = await resolvePlay(url);
  if (!play) {
    return new Response("Could not resolve a player URL from getsuperembed.link", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const res = await fetch(play, {
      headers: {
        "user-agent": UA,
        referer: "https://superembed.stream/",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const html = await res.text();
    if (!res.ok) {
      return new Response(`Upstream player page returned HTTP ${res.status}`, {
        status: 502,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Request failed: ${msg}`, { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/se_player.php") return handlePlayer(url);
    if (path === "/player") return handleProxy(url);
    if (path === "/check.php") return handleCheck(url);
    if (path === "/") {
      return new Response(
        "SuperEmbed self-hosted player worker is running.\n" +
          "Use /player?video_id=...&tmdb=1 (proxied player), /se_player.php?video_id=...&tmdb=1 (302), or /check.php (diagnostics).\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
    return new Response("Not found.", { status: 404 });
  },
};