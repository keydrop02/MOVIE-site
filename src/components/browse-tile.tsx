import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/images";

/**
 * Backdrop tile matching the GenreCard layout: aspect-[5/2], background
 * image with gradient overlay, text at bottom-left.
 */
export function BrowseTile({
  label,
  href,
  backdropPath,
  emoji,
  className,
}: {
  label: string;
  href: string;
  backdropPath?: string | null;
  emoji?: string;
  className?: string;
}) {
  const image = tmdbImage(backdropPath, "backdrop", "sm");
  return (
    <Link
      href={href}
      className={cn(
        "group relative block aspect-[5/2] overflow-hidden rounded-card border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
        className
      )}
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover opacity-60 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-75"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent"
      />
      <span className="absolute bottom-3 left-4 flex items-center gap-2 font-semibold tracking-tight text-foreground drop-shadow">
        {emoji && <span aria-hidden>{emoji}</span>}
        {label}
      </span>
    </Link>
  );
}
