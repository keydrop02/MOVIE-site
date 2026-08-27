import Link from "next/link";
import { Clapperboard } from "lucide-react";

const COLUMNS = [
  {
    heading: "Discover",
    links: [
      { href: "/movies", label: "Movies" },
      { href: "/tv", label: "TV Shows" },
      { href: "/anime", label: "Anime" },
      { href: "/trending", label: "Trending" },
    ],
  },
  {
    heading: "Browse",
    links: [
      { href: "/calendar", label: "Calendar" },
      { href: "/search", label: "Search" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="Movieo home"
            >
              <Clapperboard className="size-5 text-gold" aria-hidden />
              <span className="font-bold tracking-tight text-foreground">
                MOVIEO
              </span>
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-mono text-xs tracking-widest text-faint uppercase">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs leading-relaxed text-faint">
            Metadata and artwork provided by{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-2 transition hover:text-muted"
            >
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by
            TMDB. Additional data by{" "}
            <a
              href="https://www.omdbapi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-2 transition hover:text-muted"
            >
              OMDb
            </a>
            .
          </p>
          <p className="mt-3 font-mono text-xs text-faint">
            © {new Date().getFullYear()} Movieo
          </p>
        </div>
      </div>
    </footer>
  );
}
