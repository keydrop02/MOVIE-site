"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

/**
 * A compact back button placed independently of the main floating
 * navigation, used on detail and library pages. Resolves history
 * if available, otherwise navigates to the provided fallback.
 */
export function BackButton({ fallbackHref = "/", className }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-sm text-secondary backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span>Back</span>
    </button>
  );
}
