"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] border border-white/10">
          <Icon className="h-6 w-6 text-muted" aria-hidden />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  retry?: () => void;
  className?: string;
}

export function ErrorState({ retry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] border border-white/10">
        <svg
          className="h-6 w-6 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
      <p className="max-w-sm text-sm text-muted">We couldn&apos;t load this content.</p>
      {retry && (
        <Button variant="secondary" size="sm" onClick={retry} className="mt-2">
          Try Again
        </Button>
      )}
    </div>
  );
}
