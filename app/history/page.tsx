"use client";

import { Clock, Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/storage/library-context";
import { LibraryCard } from "@/components/library/library-card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { history, progress, removeFromHistory, clearHistory } = useLibrary();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Watch History
          </h1>
          <p className="mt-1 text-sm text-muted">
            {history.length} {history.length === 1 ? "title" : "titles"} watched
          </p>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Clear your entire watch history?")) {
                clearHistory();
              }
            }}
            className="text-muted hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear history
          </Button>
        )}
      </header>

      {history.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Your watch history is empty"
          description="Movies and shows you watch will appear here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...history]
            .sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt))
            .map((h) => {
            const prog = progress[`${h.mediaType}-${h.tmdbId}`];
            const pct = prog && prog.duration > 0 ? Math.min(1, prog.progress / prog.duration) : undefined;
            return (
              <LibraryCard
                key={`${h.mediaType}-${h.tmdbId}`}
                item={h}
                progress={pct}
                lastWatchedAt={h.lastWatchedAt}
                onRemove={() => removeFromHistory(h.mediaType, h.tmdbId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
