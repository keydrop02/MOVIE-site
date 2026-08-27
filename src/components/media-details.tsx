import type { MediaDetails } from "@/lib/api/types";
import { DetailBanner } from "./detail-banner";
import { CastRail } from "./cast-card";

export function MovieDetails({
  item,
  useAnimeRoutes = false,
}: {
  item: MediaDetails;
  useAnimeRoutes?: boolean;
}) {
  return (
    <>
      <DetailBanner item={item} useAnimeRoutes={useAnimeRoutes} />
      {!!item.cast.length && (
        <section aria-label="Top billed cast" className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Cast</h2>
          <CastRail cast={item.cast} />
        </section>
      )}
    </>
  );
}

export function TVDetails({
  item,
  useAnimeRoutes = false,
}: {
  item: MediaDetails;
  useAnimeRoutes?: boolean;
}) {
  return (
    <>
      <DetailBanner item={item} useAnimeRoutes={useAnimeRoutes} />
      {!!item.cast.length && (
        <section aria-label="Top billed cast" className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Cast</h2>
          <CastRail cast={item.cast} />
        </section>
      )}
    </>
  );
}
