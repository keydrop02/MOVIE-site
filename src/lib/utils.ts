export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatRuntime(minutes?: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatRating(rating?: number | null): string | undefined {
  if (rating == null || rating <= 0) return undefined;
  return rating.toFixed(1);
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let fmt = dateFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", options);
    dateFormatters.set(key, fmt);
  }
  return fmt;
}

export function formatDate(
  iso?: string | null,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return getDateFormatter(options).format(date);
}

export function yearOf(iso?: string | null): number | undefined {
  if (!iso) return undefined;
  const year = Number.parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

export function truncate(text?: string | null, max = 220): string | undefined {
  if (!text) return undefined;
  const clean = text.trim();
  if (!clean) return undefined;
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function toNumberParam(value: unknown): number | undefined {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function toStringParam(value: unknown): string | undefined {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
}
