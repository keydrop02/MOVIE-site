import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  className?: string;
  showIcon?: boolean;
}

export function RatingBadge({ rating, className, showIcon = true }: RatingBadgeProps) {
  if (!rating || rating <= 0) return null;
  const formatted = rating.toFixed(1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm",
        className
      )}
    >
      {showIcon && <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />}
      {formatted}
    </span>
  );
}
