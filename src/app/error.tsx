"use client";

import { ErrorState } from "@/components/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <ErrorState
        title="Something went wrong"
        message="An unexpected error occurred while loading this page."
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Try again
          </button>
        }
      />
      {process.env.NODE_ENV === "development" && (
        <p className="mt-6 text-center font-mono text-xs text-faint">
          {error.digest ?? error.message}
        </p>
      )}
    </div>
  );
}
