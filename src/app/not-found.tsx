import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface">
        <Compass className="size-7 text-gold" aria-hidden />
      </span>
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        We couldn&apos;t find that title
      </h1>
      <p className="text-sm leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        Back to home
      </Link>
    </div>
  );
}
