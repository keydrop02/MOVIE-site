"use client";

import { Check, ChevronDown } from "lucide-react";
import type { Genre } from "@/lib/tmdb/types";
import { MEDIA_SORTS } from "@/lib/constants";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Filters {
  genre?: number;
  year?: number;
  rating?: number;
  country?: string;
  language?: string;
  sort?: string;
}

interface FilterBarProps {
  genres: Genre[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  hideCountry?: boolean;
  hideLanguage?: boolean;
}

const YEARS = Array.from({ length: 55 }, (_, i) => new Date().getFullYear() - i);
const RATINGS = [9, 8, 7, 6, 5];
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "KR", name: "South Korea" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AU", name: "Australia" },
];
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
];

function Pill({
  label,
  active,
  children,
  labelActive,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
  labelActive?: string;
}) {
  return (
    <Popover
      label={label}
      trigger={
        <button
          type="button"
          aria-haspopup="true"
          className={cn(
            "flex h-9 shrink-0 items-center rounded-full border border-white/10 px-3.5 text-sm transition-colors",
            active
              ? "border-accent/50 bg-accent/15 font-medium text-accent"
              : "bg-surface-elevated text-secondary hover:bg-surface-hover hover:text-foreground"
          )}
        >
          <span className="leading-none">{active && labelActive ? labelActive : label}</span>
          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-60" aria-hidden />
        </button>
      }
      contentClassName="scrollbar-thin max-h-72 w-56 overflow-y-auto"
    >
      {children}
    </Popover>
  );
}

function OptionButton({
  checked,
  children,
  onClick,
}: {
  checked: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]",
        checked ? "text-accent" : "text-secondary hover:text-foreground"
      )}
    >
      <span className="line-clamp-1">{children}</span>
      {checked && <Check className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}

export function FilterBar({ genres, filters, onChange, onReset, hideCountry, hideLanguage }: FilterBarProps) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="scrollbar-hidden flex items-center gap-2 overflow-x-auto pb-1">
      {/* Genre */}
      <Pill label="Genre" active={!!filters.genre} labelActive={genres.find((g) => g.id === filters.genre)?.name}>
        <button
          type="button"
          onClick={() => onChange({ ...filters, genre: undefined })}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
            !filters.genre ? "text-accent" : "text-secondary hover:text-foreground"
          )}
        >
          All Genres
        </button>
        {genres.map((g) => (
          <OptionButton
            key={g.id}
            checked={filters.genre === g.id}
            onClick={() => onChange({ ...filters, genre: filters.genre === g.id ? undefined : g.id })}
          >
            {g.name}
          </OptionButton>
        ))}
      </Pill>

      {/* Year */}
      <Pill label="Year" active={!!filters.year} labelActive={String(filters.year ?? "")}>
        <button
          type="button"
          onClick={() => onChange({ ...filters, year: undefined })}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
            !filters.year ? "text-accent" : "text-secondary hover:text-foreground"
          )}
        >
          Any Year
        </button>
        {YEARS.map((y) => (
          <OptionButton
            key={y}
            checked={filters.year === y}
            onClick={() => onChange({ ...filters, year: filters.year === y ? undefined : y })}
          >
            {y}
          </OptionButton>
        ))}
      </Pill>

      {/* Rating */}
      <Pill label="Rating" active={!!filters.rating} labelActive={`${filters.rating ?? ""}+`}>
        <button
          type="button"
          onClick={() => onChange({ ...filters, rating: undefined })}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
            !filters.rating ? "text-accent" : "text-secondary hover:text-foreground"
          )}
        >
          Any Rating
        </button>
        {RATINGS.map((r) => (
          <OptionButton
            key={r}
            checked={filters.rating === r}
            onClick={() => onChange({ ...filters, rating: filters.rating === r ? undefined : r })}
          >
            {r}.0 & up
          </OptionButton>
        ))}
      </Pill>

      {/* Country */}
      {!hideCountry && (
        <Pill
          label="Country"
          active={!!filters.country}
          labelActive={COUNTRIES.find((c) => c.code === filters.country)?.name}
        >
          <button
            type="button"
            onClick={() => onChange({ ...filters, country: undefined })}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
              !filters.country ? "text-accent" : "text-secondary hover:text-foreground"
            )}
          >
            Anywhere
          </button>
          {COUNTRIES.map((c) => (
            <OptionButton
              key={c.code}
              checked={filters.country === c.code}
              onClick={() =>
                onChange({ ...filters, country: filters.country === c.code ? undefined : c.code })
              }
            >
              {c.name}
            </OptionButton>
          ))}
        </Pill>
      )}

      {/* Language */}
      {!hideLanguage && (
        <Pill
          label="Language"
          active={!!filters.language}
          labelActive={LANGUAGES.find((l) => l.code === filters.language)?.name}
        >
          <button
            type="button"
            onClick={() => onChange({ ...filters, language: undefined })}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
              !filters.language ? "text-accent" : "text-secondary hover:text-foreground"
            )}
          >
            Any Language
          </button>
          {LANGUAGES.map((l) => (
            <OptionButton
              key={l.code}
              checked={filters.language === l.code}
              onClick={() =>
                onChange({ ...filters, language: filters.language === l.code ? undefined : l.code })
              }
            >
              {l.name}
            </OptionButton>
          ))}
        </Pill>
      )}

      {/* Sort */}
      <Pill
        label="Sort"
        active={!!filters.sort}
        labelActive={MEDIA_SORTS.find((s) => s.value === filters.sort)?.label}
      >
        {MEDIA_SORTS.map((s) => (
          <OptionButton
            key={s.value}
            checked={filters.sort === s.value}
            onClick={() =>
              onChange({ ...filters, sort: filters.sort === s.value ? undefined : s.value })
            }
          >
            {s.label}
          </OptionButton>
        ))}
      </Pill>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="h-9 shrink-0 rounded-full px-3 text-sm text-muted underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Reset
        </button>
      )}
    </div>
  );
}
