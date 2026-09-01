import type { PlaybackSource } from "./types";

// ── Types ──────────────────────────────────────────────

interface EmbedProvider {
  id: string;
  name: string;
  recommended?: boolean;
  sandbox?: string;
  referrerPolicy?: ReferrerPolicy;
  capabilities: {
    movie: boolean;
    tv: boolean;
  };
  movie: (id: string) => string;
  tv: (id: string, season: number, episode: number) => string;
  /** Providers that render their own player UI instead of a plain iframe. */
  player?: "superembed";
}

// ── Registry ───────────────────────────────────────────

const providers: EmbedProvider[] = [
  {
    id: "movieo",
    name: "MovieO",
    recommended: true,
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://play.xpass.top/e/movie/${id}`,
    tv: (id, s, e) => `https://play.xpass.top/e/tv/${id}/${s}/${e}`,
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    recommended: true,
    player: "superembed",
    capabilities: { movie: true, tv: true },
    // The JSON Data Hub (seapi.link) returns per-mirror playback pages; the
    // provider resolves sources via /api/stream/sources (SQLite-cached for
    // 48h per upstream terms) and renders a local server selector.
    movie: () => "",
    tv: () => "",
  },
  {
    id: "core",
    name: "Core",
    recommended: true,
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://vidcore.net/movie/${id}`,
    tv: (id, s, e) => `https://vidcore.net/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    recommended: true,
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://vsembed.ru/embed/movie/${id}`,
    tv: (id, s, e) => `https://vsembed.ru/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "zxcstream",
    name: "ZXCStream",
    recommended: true,
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://www.zxcstream.xyz/player/movie/${id}`,
    tv: (id, s, e) => `https://www.zxcstream.xyz/player/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidgod",
    name: "VidGod",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://vidgod.site/movie/${id}?autoplay=true`,
    tv: (id, s, e) => `https://vidgod.site/tv/${id}/${s}/${e}?autoplay=true`,
  },
  {
    id: "cinemaos",
    name: "CinemaOS",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://cinemaos.tech/player/${id}`,
    tv: (id, s, e) => `https://cinemaos.tech/player/${id}/${s}/${e}`,
  },
  {
    id: "vid2",
    name: "Vid2",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://airflix1.com/embed/movie/${id}`,
    tv: (id, s, e) => `https://airflix1.com/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "peach",
    name: "Peach",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://peachify.top/embed/movie/${id}`,
    tv: (id, s, e) => `https://peachify.top/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "mapi",
    name: "MAPI",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://vidzen.fun/movie/${id}`,
    tv: (id, s, e) => `https://vidzen.fun/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidplays",
    name: "VidPlays",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://vidplays.fun/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidplays.fun/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "videasy",
    name: "VidEasy",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://player.videasy.net/movie/${id}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
  },
  {
    id: "french",
    name: "French",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://frembed.buzz/api/film.php?id=${id}`,
    tv: (id, s, e) => `https://frembed.buzz/api/serie.php?id=${id}&sa=${s}&epi=${e}`,
  },
  {
    id: "spanish",
    name: "Spanish",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://play.modocine.com/play.php/embed/movie/${id}`,
    tv: (id, s, e) => `https://play.modocine.com/play.php/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "italian",
    name: "Italian",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://vixsrc.to/movie/${id}?lang=it`,
    tv: (id, s, e) => `https://vixsrc.to/tv/${id}/${s}/${e}?lang=it`,
  },
  {
    id: "screen",
    name: "Screen",
    capabilities: { movie: true, tv: true },
    movie: (id) => `https://screenscape.me/embed?tmdb=${id}&type=movie`,
    tv: (id, s, e) => `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}`,
  },
];

// ── Ordering (computed once at module load) ─────────────

const orderedProviders = [...providers].sort((a, b) => {
  if (a.id === "movieo") return -1;
  if (b.id === "movieo") return 1;
  if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
  return a.name.localeCompare(b.name);
});

// ── Public API ─────────────────────────────────────────

export function getEmbedSources(ctx: {
  type: "movie" | "tv";
  tmdbId: string | number;
  season?: number;
  episode?: number;
}): PlaybackSource[] {
  if (ctx.type === "tv" && (ctx.season == null || ctx.episode == null)) {
    return [];
  }

  return orderedProviders
    .filter((p) => p.capabilities[ctx.type])
    .map((p) => {
      const base = {
        id: p.id,
        label: p.name,
        sandbox: p.sandbox,
        referrerPolicy: p.referrerPolicy,
      };
      if (p.player === "superembed") {
        return {
          ...base,
          kind: "superembed" as const,
          url: "",
          meta: {
            type: ctx.type,
            tmdbId: Number(ctx.tmdbId),
            season: ctx.season,
            episode: ctx.episode,
          },
        };
      }
      return {
        ...base,
        kind: "embed" as const,
        url:
          ctx.type === "movie"
            ? p.movie(String(ctx.tmdbId))
            : p.tv(String(ctx.tmdbId), ctx.season!, ctx.episode!),
      };
    });
}