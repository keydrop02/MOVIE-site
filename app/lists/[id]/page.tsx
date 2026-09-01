"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { useLibrary } from "@/lib/storage/library-context";
import { LibraryCard } from "@/components/library/library-card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lists, updateList, removeFromList } = useLibrary();
  const list = lists.find((l) => l.id === id);
  if (!list) notFound();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateList(list.id, { name: name.trim() || list.name, description: description.trim() });
    setEditing(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <Link
        href="/lists"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        My Lists
      </Link>

      <header className="mb-6">
        {editing ? (
          <form
            onSubmit={save}
            className="mx-auto mb-6 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/[0.08] bg-surface p-4"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              aria-label="List name"
              className="h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-lg font-bold text-foreground placeholder:text-muted focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              aria-label="List description"
              rows={2}
              className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-secondary placeholder:text-muted focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setName(list.name);
                  setDescription(list.description);
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4" aria-hidden />
                Cancel
              </Button>
              <Button type="submit" size="sm">
                <Check className="h-4 w-4" aria-hidden />
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {list.name}
              </h1>
              {list.description && (
                <p className="mt-1 text-sm text-secondary">{list.description}</p>
              )}
              <p className="mt-1 text-sm text-muted">
                {list.items.length} {list.items.length === 1 ? "item" : "items"} · created{" "}
                {formatDate(list.createdAt)}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </div>
        )}
      </header>

      {list.items.length === 0 ? (
        <EmptyState
          title="This list is empty"
          description="Use the Add to List button on any title to add it here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...list.items]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((item) => (
            <div key={item.id} className="relative">
              <LibraryCard
                item={item}
                onRemove={() => removeFromList(list.id, item.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
