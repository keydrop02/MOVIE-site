import { Star } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";

export function RatingBadge({
  rating,
  className,
  size = "sm",
}: {
  rating?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const value = formatRating(rating);
  if (!value) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm font-medium text-foreground",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
    >
      <Star className="size-3 fill-gold text-gold" aria-hidden />
      {value}
    </span>
  );
}
