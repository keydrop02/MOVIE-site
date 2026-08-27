export const siteConfig = {
  name: "Movieo",
  tagline: "Discover your next favorite movie or show",
  description:
    "Movieo is a modern movie and TV discovery platform. Browse trending films, popular series, top rated classics, anime, and upcoming releases — all in one beautifully crafted catalog.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000",
} as const;

export type MediaType = "movie" | "tv";

export const mediaTypePath = (type: MediaType) => type;

export const ANIME_GENRE_ID = 16;
