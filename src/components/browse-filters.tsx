"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Genre } from "@/lib/api/types";

const TYPE_OPTIONS = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "Series" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "top_rated", label: "Top Rated" },
  { value: "latest", label: "Latest" },
];

const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear();
  const years: Array<{ value: string; label: string }> = [
    { value: "", label: "Any Year" },
  ];
  for (let y = current; y >= current - 20; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
})();

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-muted transition focus:border-gold focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function BrowseFilters({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const year = searchParams.get("year") ?? "";

  const hasActiveFilters = Boolean(type || genre || sort || year);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.replace(`/browse?${params.toString()}`);
    },
    [router, searchParams]
  );

  const genreOptions = useMemo(
    () => [
      { value: "", label: "All Genres" },
      ...genres.map((g) => ({ value: String(g.id), label: g.name })),
    ],
    [genres]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={type}
        onChange={(v) => update("type", v)}
        options={TYPE_OPTIONS}
        label="Type"
      />
      <Select
        value={genre}
        onChange={(v) => update("genre", v)}
        options={genreOptions}
        label="Genre"
      />
      <Select
        value={sort}
        onChange={(v) => update("sort", v)}
        options={SORT_OPTIONS}
        label="Sort"
      />
      <Select
        value={year}
        onChange={(v) => update("year", v)}
        options={YEAR_OPTIONS}
        label="Year"
      />
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.replace("/browse")}
          className="h-8 rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted transition hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
