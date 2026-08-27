import type { Metadata } from "next";
import type { MediaDetails } from "@/lib/api/types";
import { truncate } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { tmdbImageAbsolute } from "@/lib/images";
import { TVDetails, MovieDetails } from "@/components/media-details";
import { SectionHeader } from "@/components/section-header";
import { MediaRow } from "@/components/media-row";
import { MediaCard } from "@/components/media-card";
import { SeasonGrid } from "@/components/season-card";

/**
 * Shared rendering for series/movie detail pages. Both the standard
 * `/tv/[id]` + `/movie/[id]` routes and the `/anime/[type]/[id]` wrappers
 * compose these views, so every surface stays visually identical.
 *
 * Canonical URLs and JSON-LD always reference the standard routes — the
 * `/anime/...` paths are alternate entry points to the same content.
 */

function ogImages(item: MediaDetails) {
  const image = tmdbImageAbsolute(item.backdropPath ?? item.posterPath, "backdrop", "lg");
  return image ? [{ url: image }] : undefined;
}

function aggregateRating(item: MediaDetails) {
  return item.rating
    ? {
        "@type": "AggregateRating",
        ratingValue: item.rating.toFixed(1),
        bestRating: "10",
        ratingCount: item.voteCount ?? undefined,
      }
    : undefined;
}

export function seriesMetadata(
  series: MediaDetails,
  id: string,
  label: string = "Series"
): Metadata {
  const yearSuffix = series.year ? ` (${series.year})` : "";
  const description =
    truncate(series.overview, 160) ??
    `Episodes, cast, and more for ${series.title}${yearSuffix}.`;

  return {
    title: `${series.title}${yearSuffix} — ${label}`,
    description,
    alternates: { canonical: `/tv/${id}` },
    openGraph: {
      title: `${series.title}${yearSuffix}`,
      description,
      url: `/tv/${id}`,
      images: ogImages(series),
    },
  };
}

export function movieMetadata(
  movie: MediaDetails,
  id: string,
  label: string = "Movie"
): Metadata {
  const yearSuffix = movie.year ? ` (${movie.year})` : "";
  const description =
    truncate(movie.overview, 160) ??
    `Details, cast, and more for ${movie.title}${yearSuffix}.`;

  return {
    title: `${movie.title}${yearSuffix} — ${label}`,
    description,
    alternates: { canonical: `/movie/${id}` },
    openGraph: {
      title: `${movie.title}${yearSuffix}`,
      description,
      url: `/movie/${id}`,
      images: ogImages(movie),
    },
  };
}

export function SeriesView({
  series,
  useAnimeRoutes = false,
}: {
  series: MediaDetails;
  /** Rendered under `/anime/[type]/[id]` — watch links carry `?ns=anime`. */
  useAnimeRoutes?: boolean;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: series.title,
    description: series.overview,
    image: tmdbImageAbsolute(series.posterPath, "poster", "md") ?? undefined,
    startDate: series.releaseDate,
    numberOfSeasons: series.numberOfSeasons,
    url: `${siteConfig.url}/tv/${series.tmdbId}`,
    ...(series.rating ? { aggregateRating: aggregateRating(series) } : {}),
  };

  const recommendations =
    series.recommendations.length > 0 ? series.recommendations : series.similar;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TVDetails item={series} useAnimeRoutes={useAnimeRoutes} />

      <div className="space-y-10 pt-6 pb-4">
        {series.seasons && series.seasons.length > 0 && (
          <section aria-label="Seasons" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Seasons" />
            <SeasonGrid seasons={series.seasons} tvId={series.tmdbId} keepNamespace={useAnimeRoutes} />
          </section>
        )}

        {recommendations.length > 0 && (
          <section aria-label="Similar titles" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Similar Titles" />
            <MediaRow>
              {recommendations
                .filter((r) => r.tmdbId !== series.tmdbId)
                .slice(0, 12)
                .map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
            </MediaRow>
          </section>
        )}
      </div>
    </>
  );
}

export function MovieView({
  movie,
  useAnimeRoutes = false,
}: {
  movie: MediaDetails;
  /** Rendered under `/anime/[type]/[id]` — watch links carry `?ns=anime`. */
  useAnimeRoutes?: boolean;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview,
    image: tmdbImageAbsolute(movie.posterPath, "poster", "md") ?? undefined,
    datePublished: movie.releaseDate,
    url: `${siteConfig.url}/movie/${movie.tmdbId}`,
    ...(movie.rating ? { aggregateRating: aggregateRating(movie) } : {}),
  };

  const recommendations =
    movie.recommendations.length > 0 ? movie.recommendations : movie.similar;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MovieDetails item={movie} useAnimeRoutes={useAnimeRoutes} />

      {recommendations.length > 0 && (
        <section aria-label="Similar titles" className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
          <SectionHeader title="Similar Titles" />
          <MediaRow>
            {recommendations
              .filter((r) => r.tmdbId !== movie.tmdbId)
              .slice(0, 12)
              .map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
          </MediaRow>
        </section>
      )}
    </>
  );
}
