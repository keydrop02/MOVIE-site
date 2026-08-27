import type { LucideIcon } from "lucide-react";
import { Clapperboard } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Clapperboard,
  title = "Nothing here yet",
  message,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface">
        <Icon className="size-5 text-muted" aria-hidden />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
