import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MediaCardSkeletonProps {
  className?: string;
}

/** Skeleton matching MediaCard dimensions to avoid layout shift. */
export function MediaCardSkeleton({ className }: MediaCardSkeletonProps) {
  return (
    <div className={cn("group", className)}>
      <div className="block overflow-hidden rounded-xl border border-white/[0.06] bg-surface-elevated">
        <div className="relative aspect-[2/3] w-full bg-surface-elevated">
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
