import { Play } from "lucide-react";
import Link from "next/link";

/**
 * Links to the watch page with the trailer loaded in the player
 * (`?trailer=1`) instead of opening YouTube in a new tab.
 */
export function TrailerButton({
  videoKey,
  watchHref,
  label = "Trailer",
}: {
  videoKey?: string;
  watchHref?: string;
  label?: string;
}) {
  if (!videoKey || !watchHref) return null;
  return (
    <Link
      href={watchHref}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong bg-card/70 px-5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <Play className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
