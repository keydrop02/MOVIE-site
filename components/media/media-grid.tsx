import type { Media } from "@/lib/tmdb/types";
import { MediaCard } from "@/components/media/media-card";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { cn } from "@/lib/utils";

interface MediaGridProps {
  items: Media[];
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (media: Media) => void;
  className?: string;
}

/**
 * Responsive poster grid: 2–3 mobile, 4–6 tablet, 6–8 desktop.
 * Uses CSS grid so cards always align perfectly.
 */
export function MediaGrid({
  items,
  isFavorite,
  onToggleFavorite,
  className,
}: MediaGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
        className
      )}
    >
      {items.map((media) => (
        <MediaCard
          key={`${media.type}-${media.id}`}
          media={media}
          isFavorite={isFavorite?.(`${media.type}-${media.id}`)}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(media) : undefined}
          showFavoriteOnHover={!!onToggleFavorite}
          imageSizes="(max-width: 640px) 46vw, (max-width: 768px) 30vw, (max-width: 1200px) 20vw, 13vw"
        />
      ))}
    </div>
  );
}

export function MediaGridSkeleton({ count = 12, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}
