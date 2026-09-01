"use client";

import { Heart } from "lucide-react";
import { useLibrary } from "@/lib/storage/library-context";
import { LibraryCard } from "@/components/library/library-card";
import { EmptyState } from "@/components/ui/states";

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useLibrary();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Favorites
        </h1>
        <p className="mt-1 text-sm text-muted">
          {favorites.length} saved {favorites.length === 1 ? "title" : "titles"}
        </p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any movie or show to save it here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {favorites.map((f) => (
            <LibraryCard
              key={`${f.mediaType}-${f.tmdbId}`}
              item={f}
              onRemove={() =>
                toggleFavorite({ tmdbId: f.tmdbId, mediaType: f.mediaType, title: f.title, posterPath: f.posterPath })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
