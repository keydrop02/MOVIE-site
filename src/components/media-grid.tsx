import type { MediaItem } from "@/lib/api/types";
import { MediaCard } from "./media-card";
import { cn } from "@/lib/utils";

export function MediaGrid({
  items,
  className,
}: {
  items: MediaItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6",
        className
      )}
    >
      {items.map((item, index) => (
        <MediaCard
          key={item.id}
          item={item}
          priority={index < 6}
          className="w-full"
        />
      ))}
    </div>
  );
}
