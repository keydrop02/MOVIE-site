import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUpcomingMovies } from "@/lib/api/movies";
import { getOnTheAirTv, getAiringTodayTv } from "@/lib/api/tv";
import type { MediaItem } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { tmdbImage } from "@/lib/images";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Upcoming movie and TV releases — today, tomorrow, this week and beyond.",
  alternates: { canonical: "/calendar" },
};

type Bucket = "today" | "tomorrow" | "thisWeek" | "nextWeek" | "later";

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  thisWeek: "This Week",
  nextWeek: "Next Week",
  later: "Later",
};

const BUCKET_ORDER: Bucket[] = ["today", "tomorrow", "thisWeek", "nextWeek", "later"];

function bucketFor(dateIso: string | undefined, now: Date): Bucket | null {
  if (!dateIso) return null;
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const dayMs = 86_400_000;
  const diffDays = Math.floor((date.getTime() - startOfToday.getTime()) / dayMs);

  if (diffDays < 0) return null;
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays <= 7) return "thisWeek";
  if (diffDays <= 14) return "nextWeek";
  return "later";
}

async function loadCalendar(): Promise<Map<Bucket, MediaItem[]>> {
  const now = new Date();
  const [upcomingMovies, onTheAir, airingToday] = await Promise.allSettled([
    getUpcomingMovies(),
    getOnTheAirTv(),
    getAiringTodayTv(),
  ]);

  const items = [
    ...(upcomingMovies.status === "fulfilled" ? upcomingMovies.value.items : []),
    ...(onTheAir.status === "fulfilled" ? onTheAir.value.items : []),
    ...(airingToday.status === "fulfilled" ? airingToday.value.items : []),
  ];

  const seen = new Set<string>();
  const buckets = new Map<Bucket, MediaItem[]>(BUCKET_ORDER.map((b) => [b, []]));

  for (const item of items) {
    const bucket = bucketFor(item.releaseDate, now);
    if (!bucket || !item.posterPath) continue;
    const key = `${item.type}-${item.tmdbId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    buckets.get(bucket)?.push(item);
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
  }

  return buckets;
}

export default async function CalendarPage() {
  let buckets: Map<Bucket, MediaItem[]>;
  try {
    buckets = await loadCalendar();
  } catch {
    buckets = new Map(BUCKET_ORDER.map((b) => [b, []]));
  }

  const total = [...buckets.values()].reduce((sum, list) => sum + list.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendar</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Upcoming releases grouped by when they arrive, using real release dates.
      </p>

      {total === 0 ? (
        <p className="mt-10 rounded-card border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted">
          No upcoming releases found right now. Check back soon.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {BUCKET_ORDER.map((bucket) => {
            const items = buckets.get(bucket) ?? [];
            if (!items.length) return null;
            return (
              <section key={bucket} aria-label={BUCKET_LABELS[bucket]}>
                <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight">
                  {BUCKET_LABELS[bucket]}
                  <span className="font-mono text-xs font-normal text-faint">
                    {items.length}
                  </span>
                  <span aria-hidden className="h-px flex-1 bg-border" />
                </h2>
                <ul className="space-y-2">
                  {items.slice(0, 14).map((item) => (
                    <li key={`${item.type}-${item.tmdbId}`}>
                      <Link
                        href={`/${item.type}/${item.tmdbId}`}
                        className="group flex items-center gap-4 rounded-card border border-transparent bg-card px-4 py-3 transition hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      >
                        <span className="relative block h-[72px] w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                          <Image
                            src={tmdbImage(item.posterPath, "poster", "sm") ?? ""}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground group-hover:text-gold">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-xs text-faint">
                            {formatDate(item.releaseDate)} ·{" "}
                            {item.type === "tv" ? "Series episode" : "Movie"}
                          </span>
                        </span>
                        {item.rating != null && (
                          <span className="shrink-0 font-mono text-xs text-muted">
                            ★ {item.rating.toFixed(1)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
