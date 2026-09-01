"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, List, Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/storage/library-context";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export default function ListsPage() {
  const { lists, createList, deleteList } = useLibrary();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createList(name, description);
    setName("");
    setDescription("");
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            My Lists
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create custom collections of movies and shows.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0"
        >
          {!showForm && <Plus className="h-4 w-4" aria-hidden />}
          {showForm ? "Close" : "New List"}
        </Button>
      </header>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mx-auto mb-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:flex-row sm:items-center"
        >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list name..."
          maxLength={120}
          aria-label="List name"
          className="h-11 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          maxLength={500}
          aria-label="List description"
          className="h-11 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-foreground placeholder:text-muted focus:outline-none sm:max-w-xs"
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowForm(false)}
          className="shrink-0"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          Create
        </Button>
        </form>
      )}

      {lists.length === 0 ? (
        <EmptyState
          icon={List}
          title="No lists yet"
          description="Create your first list above to start organizing titles."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="group rounded-2xl border border-white/[0.08] bg-surface-elevated p-4 transition-colors hover:border-white/20"
            >
              <Link href={`/lists/${list.id}`} className="block">
                <div className="mb-2 flex h-28 items-center overflow-hidden rounded-xl bg-surface">
                  {list.items.length > 0 ? (
                    <div className="grid h-full w-full grid-cols-3 overflow-hidden">
                      {list.items.slice(0, 3).map((it) => (
                        <div
                          key={it.id}
                          className="relative h-full"
                          style={{
                            backgroundImage: it.posterPath
                              ? `url(https://image.tmdb.org/t/p/w154${it.posterPath})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="w-full text-center text-sm text-muted">
                      {list.items.length} {list.items.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-foreground">{list.name}</h2>
                {list.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted">{list.description}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {list.items.length} {list.items.length === 1 ? "item" : "items"}
                </p>
              </Link>
              <button
                type="button"
                aria-label={`Delete list ${list.name}`}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete the list "${list.name}" and its ${list.items.length} ${
                        list.items.length === 1 ? "item" : "items"
                      }?`
                    )
                  ) {
                    deleteList(list.id);
                  }
                }}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
