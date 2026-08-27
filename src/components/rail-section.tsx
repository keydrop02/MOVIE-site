import { Suspense } from "react";
import type { MediaItem } from "@/lib/api/types";
import { MediaCard } from "./media-card";
import { MediaRow } from "./media-row";
import { RailSkeleton } from "./loading-skeleton";
import { ErrorState } from "./error-state";
import { SectionHeader } from "./section-header";

async function RailBody({
  itemsPromise,
  ranked = false,
  viewAllHref,
  viewAllLabel,
}: {
  itemsPromise: Promise<MediaItem[]>;
  ranked?: boolean;
  viewAllHref?: string;
  viewAllLabel: string;
}) {
  let items: MediaItem[];
  try {
    items = await itemsPromise;
  } catch {
    return (
      <ErrorState
        compact
        title="Couldn't load this row"
        message="The data provider is temporarily unavailable."
      />
    );
  }

  if (!items.length) return null;

  if (ranked) {
    return (
      <MediaRow>
        {items.slice(0, 10).map((item, index) => (
          <div key={item.id} className="snap-start pl-6 first:pl-2">
            <MediaCard item={item} rank={index + 1} priority={index < 3} />
          </div>
        ))}
      </MediaRow>
    );
  }

  return (
    <MediaRow>
      {items.map((item, index) => (
        <MediaCard key={item.id} item={item} priority={index < 4} />
      ))}
    </MediaRow>
  );
}

/**
 * Server-rendered horizontal rail that streams in behind a skeleton and
 * degrades gracefully when its data source fails.
 */
export function RailSection({
  title,
  href,
  linkLabel = "View all",
  itemsPromise,
  ranked = false,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  itemsPromise: Promise<MediaItem[]>;
  ranked?: boolean;
}) {
  return (
    <section aria-label={title} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader title={title} />
      <Suspense
        fallback={<RailSkeleton count={ranked ? 10 : 8} />}
      >
        <RailBody
          itemsPromise={itemsPromise}
          ranked={ranked}
          viewAllHref={href}
          viewAllLabel={linkLabel}
        />
      </Suspense>
    </section>
  );
}
