"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import type { MediaRef } from "@/lib/storage/types";
import { useLibrary } from "@/lib/storage/library-context";
import { cn } from "@/lib/utils";

interface PlayButtonProps {
  media: MediaRef;
  className?: string;
}

export function PlayButton({ media, className }: PlayButtonProps) {
  const router = useRouter();
  const { addToHistory } = useLibrary();

  const play = () => {
    addToHistory(media, 0, 0);
    router.push(`/watch?type=${media.mediaType}&id=${media.tmdbId}`);
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Play ${media.title}`}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]",
        className
      )}
    >
      <Play className="h-4 w-4 fill-current" aria-hidden />
      Play
    </button>
  );
}