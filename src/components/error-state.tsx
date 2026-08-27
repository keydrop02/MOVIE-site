import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content right now. Please try again in a moment.",
  action,
  compact = false,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={
        compact
          ? "flex items-center gap-3 rounded-card border border-border bg-card px-5 py-4 text-sm text-muted"
          : "flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-card px-6 py-10 text-center"
      }
    >
      <span
        className={
          compact
            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-surface"
            : "flex size-10 items-center justify-center rounded-full bg-surface"
        }
      >
        <AlertTriangle
          className={          compact ? "size-4 text-gold" : "size-5 text-gold"}
          aria-hidden
        />
      </span>
      <div className={compact ? "" : "flex flex-col items-center gap-3"}>
        <h2 className={compact ? "font-medium text-foreground" : "text-base font-semibold text-foreground"}>
          {title}
        </h2>
        {!compact && <p className="max-w-sm text-sm text-muted">{message}</p>}
      </div>
      {action && <div className={compact ? "ml-auto" : "mt-2"}>{action}</div>}
    </div>
  );
}
