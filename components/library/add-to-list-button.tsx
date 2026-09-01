"use client";

import { useState } from "react";
import Link from "next/link";
import { ListPlus, Plus, Check } from "lucide-react";
import type { MediaRef } from "@/lib/storage/types";
import { useLibrary } from "@/lib/storage/library-context";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AddToListButtonProps {
  media: MediaRef;
  showLabel?: boolean;
  className?: string;
}

export function AddToListButton({ media, showLabel, className }: AddToListButtonProps) {
  const { lists, addToList, createList } = useLibrary();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const inList = (listId: string) =>
    lists
      .find((l) => l.id === listId)
      ?.items.some(
        (it) => it.tmdbId === media.tmdbId && it.mediaType === media.mediaType
      );

  const handleCreate = () => {
    const list = createList(name);
    if (list) {
      addToList(list.id, media);
      setName("");
      setCreating(false);
    }
  };

  return (
    <Popover
      label="Add to list"
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm text-foreground backdrop-blur transition-colors hover:bg-white/[0.12]",
            className
          )}
        >
          <ListPlus className="h-4 w-4" aria-hidden />
          {showLabel && "Add to List"}
        </button>
      }
      contentClassName="w-60"
    >
      <div className="p-1">
        <p className="px-3 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-muted">
          Add to list
        </p>

        {lists.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted">
            No lists yet. Create one below.
          </p>
        )}

        <div className="max-h-52 overflow-y-auto">
          {lists.map((list) => {
            const added = inList(list.id);
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => addToList(list.id, media)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]",
                  added ? "text-accent" : "text-secondary hover:text-foreground"
                )}
              >
                <span className="line-clamp-1">{list.name}</span>
                {added && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>

        {lists.length > 0 && (
          <Link
            href="/lists"
            className="mt-1 block rounded-lg px-3 py-2 text-xs text-secondary underline-offset-2 hover:text-foreground hover:underline"
          >
            Manage lists →
          </Link>
        )}

        <div className="border-t border-white/10 pt-2 mt-1">
          {creating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name..."
                maxLength={120}
                aria-label="New list name"
                className="h-9 flex-1 rounded-lg border border-white/15 bg-black/30 px-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Create list"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background disabled:opacity-40"
                disabled={!name.trim()}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent transition-colors hover:bg-white/[0.06]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              New List
            </button>
          )}
        </div>
      </div>
    </Popover>
  );
}
