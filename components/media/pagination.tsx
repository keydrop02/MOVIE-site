import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = Array.from(set)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({ currentPage, totalPages, buildHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const prev = buildHref(currentPage - 1);
  const next = buildHref(currentPage + 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-8 flex items-center justify-center gap-1.5", className)}
    >
      {currentPage > 1 ? (
        <Link
          href={prev}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-surface-elevated text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/5 text-muted opacity-40">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </span>
      )}

      {pageNumbers(currentPage, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={buildHref(n)}
            aria-current={n === currentPage ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm transition-colors",
              n === currentPage
                ? "bg-foreground font-semibold text-background"
                : "text-secondary hover:bg-white/[0.06] hover:text-foreground"
            )}
          >
            {n}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={next}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-surface-elevated text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/5 text-muted opacity-40">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
