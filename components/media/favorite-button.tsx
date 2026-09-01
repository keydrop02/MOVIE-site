"use client";

import { Heart } from "lucide-react";
import type { MediaRef } from "@/lib/storage/types";
import { useLibrary } from "@/lib/storage/library-context";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  media: MediaRef;
  showLabel?: boolean;
  className?: string;
}

export function FavoriteButton({ media, showLabel, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const active = isFavorite(media.mediaType, media.tmdbId);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(media)}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm text-foreground backdrop-blur transition-colors hover:bg-white/[0.12]",
        active && "border-accent/40 bg-accent/15 text-accent",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-accent text-accent")}
        aria-hidden
      />
      {showLabel && (active ? "Favorited" : "Favorite")}
    </button>
  );
}
