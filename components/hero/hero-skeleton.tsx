import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <div className="h-[48vh] w-full sm:h-[52vh] lg:h-[66vh]">
      <div className="flex h-full w-full items-end bg-cinema-gradient px-5 pb-14 md:px-10 lg:pb-16">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-9 w-3/4 sm:h-14 lg:h-16" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-4/5 max-w-md" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-28 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
