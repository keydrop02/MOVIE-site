import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
  className,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}) {
  const clampedTotal = Math.min(totalPages, 500);
  if (clampedTotal <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  const prev = page > 1 ? buildHref(page - 1) : null;
  const next = page < clampedTotal ? buildHref(page + 1) : null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-3 pt-6", className)}
    >
      {prev ? (
        <Link
          href={prev}
          prefetch={false}
          className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-sm text-faint opacity-50">
          Previous
        </span>
      )}

      <span className="font-mono text-sm text-muted">
        Page {page} of {clampedTotal}
      </span>

      {next ? (
        <Link
          href={next}
          prefetch={false}
          className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-sm text-faint opacity-50">
          Next
        </span>
      )}
    </nav>
  );
}
