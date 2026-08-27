import type { MediaItem } from "@/lib/api/types";
import { MediaCard } from "./media-card";
import { MediaRow } from "./media-row";

/** Horizontal rail of ranked cards with oversized outlined numerals. */
export function TopTen({ items }: { items: MediaItem[] }) {
  const ranked = items.slice(0, 10);
  if (!ranked.length) return null;

  return (
    <MediaRow>
      {ranked.map((item, index) => (
        <div key={item.id} className="snap-start pl-6 first:pl-2">
          <MediaCard item={item} rank={index + 1} priority={index < 3} />
        </div>
      ))}
    </MediaRow>
  );
}
