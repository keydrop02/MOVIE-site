import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-card bg-surface", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="w-36 shrink-0 sm:w-40 md:w-44">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="mt-2 h-4 w-4/5 rounded-md" />
      <Skeleton className="mt-1.5 h-3 w-2/5 rounded-md" />
    </div>
  );
}

export function RailSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden sm:gap-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="mt-2 h-4 w-4/5 rounded-md" />
          <Skeleton className="mt-1.5 h-3 w-2/5 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Banner-shaped placeholder matching the detail-page layout. */
export function DetailSkeleton() {
  return (
    <div aria-hidden>
      <section className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <Skeleton className="size-full rounded-none bg-surface" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Skeleton className="aspect-[2/3] w-40 rounded-card border border-border shadow-xl sm:w-48" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-2/3 max-w-md rounded-lg" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-md" />
                ))}
              </div>
              <div className="max-w-2xl space-y-2">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-11/12 rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
              <div className="flex gap-3 pt-1">
                <Skeleton className="h-11 w-36 rounded-lg" />
                <Skeleton className="h-11 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-4 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-5 w-20 rounded-md" />
        <RailSkeleton count={8} />
      </section>
    </div>
  );
}

/** Player-shaped placeholder matching the watch-page layout. */
export function WatchSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-28 rounded-md" />
      <Skeleton className="mt-5 aspect-video w-full rounded-xl" />
      <div className="mt-7 space-y-3">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-7 w-72 max-w-full rounded-lg" />
        <Skeleton className="h-3 w-full max-w-3xl rounded-md" />
      </div>
      <div className="mt-12 space-y-3">
        <Skeleton className="h-5 w-32 rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-card border border-border bg-card p-3">
            <Skeleton className="aspect-video w-28 shrink-0 rounded-md sm:w-48" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/3 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section
      aria-hidden
      className="relative flex min-h-[68vh] items-end overflow-hidden bg-card"
    >
      <Skeleton className="absolute inset-0 size-full rounded-none bg-surface" />
      <div className="relative z-10 w-full px-4 pb-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-14 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-md" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-32 rounded-lg" />
            <Skeleton className="h-11 w-28 rounded-lg" />
            <Skeleton className="h-11 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
