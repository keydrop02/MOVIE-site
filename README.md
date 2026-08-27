# Movieo

Discover your next favorite movie or show. Movieo is a movie and TV discovery
platform built with Next.js (App Router) — trending titles, popular catalogs,
top rated classics, anime, upcoming releases, rich detail pages, and a calendar.
Movie and TV metadata comes from TMDB with OMDb enrichment; anime is powered
by AniList (no API key required) with dedicated `/anime/[id]` pages.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — freekeys fallback works without keys
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TMDB_API_KEY` | no* | TMDB v3 key for all metadata. Falls back to the `freekeys` package in development. |
| `OMDB_API_KEY` | no* | OMDb key used to enrich detail pages with IMDb ratings. Same fallback. |
| `NEXT_PUBLIC_SITE_URL` | no | Public origin for canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`. Defaults to `http://localhost:3000`. |

\* Recommended to set your own keys before deploying; the fallback is intended
for local development only.

## Architecture

- `src/lib/api/` — typed server-only API layer (TMDB + OMDb + AniList GraphQL),
  fetch-level caching via `next.revalidate` tags: trending 30 min, catalogs 1 h,
  details/people 6 h, genres 24 h, search uncached. AniList responses are cached
  via `unstable_cache` since its API only accepts POST requests.
- `src/lib/player/` — pluggable playback provider abstraction. The default
  provider returns no sources; register yours with `setPlaybackProvider()` so
  `/watch/*` pages stream through your authorized source.
- `src/app/` — routes: `/`, `/movies`, `/tv`, `/trending`, `/anime`,
  `/anime/[id]`, `/calendar`, `/search`, `/movie/[id]`, `/tv/[id]`,
  `/person/[id]`, `/genre/[type]/[id]`, `/watch/movie/[id]`,
  `/watch/tv/[id]/[season]/[episode]`.
- Streaming SSR (`Suspense`) on rails/grids; ISR revalidation per route;
  JSON-LD structured data on detail pages; sitemap + robots included.

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
