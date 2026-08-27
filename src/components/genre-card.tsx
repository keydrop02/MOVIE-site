import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { Genre } from "@/lib/api/types";

export function GenreCard({
  genre,
  backdropPath,
  href,
}: {
  genre: Genre;
  backdropPath?: string | null;
  href: string;
}) {
  const image = tmdbImage(backdropPath, "backdrop", "md");
  return (
    <Link
      href={href}
      className="group relative block aspect-[5/2] overflow-hidden rounded-card border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover opacity-60 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-75"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent"
      />
      <span className="absolute bottom-3 left-4 font-semibold tracking-tight text-foreground drop-shadow">
        {genre.name}
      </span>
    </Link>
  );
}
