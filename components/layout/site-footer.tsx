import Link from "next/link";
import { Mail } from "lucide-react";
import { SITE } from "@/lib/constants";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-5 border-t border-white/[0.06] px-5 py-10 text-center md:px-10">
      <Link href="/" className="flex items-center gap-2 text-foreground" aria-label={`${SITE.name} home`}>
        <Logo />
      </Link>

      <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-secondary">
        <Link href="/movies" className="hover:text-foreground transition-colors">Movies</Link>
        <Link href="/tv" className="hover:text-foreground transition-colors">Shows</Link>
        <Link href="/search" className="hover:text-foreground transition-colors">Search</Link>
        <Link href="/lists" className="hover:text-foreground transition-colors">My List</Link>
        <Link href="/legal" className="hover:text-foreground transition-colors">Legal</Link>
      </nav>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <GithubIcon />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter / X"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <XIcon />
        </a>
        <a
          href="mailto:hello@movieo.example.com"
          aria-label="Contact"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <Mail className="h-[18px] w-[18px]" aria-hidden />
        </a>
      </div>

      <p className="max-w-xl text-xs leading-relaxed text-muted">
        Movie and TV metadata and images are provided by a third-party service and may be
        subject to change.
      </p>

      <p className="text-xs text-muted">
        © {new Date().getFullYear()} {SITE.name}. For personal use only.
      </p>
    </footer>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}
