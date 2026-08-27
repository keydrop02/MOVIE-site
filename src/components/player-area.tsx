"use client";

import { useRef } from "react";
import type { PlaybackSource } from "@/lib/player/types";
import type { StoredItem } from "@/lib/local-store";
import { VideoPlayer } from "./video-player";

export function PlayerArea({
  sources,
  poster,
  title,
  item,
  seasonEpisode,
}: {
  sources: PlaybackSource[];
  poster?: string | null;
  title: string;
  item: StoredItem;
  seasonEpisode?: { season: number; episode: number };
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <VideoPlayer
      ref={videoRef}
      sources={sources}
      poster={poster}
      title={title}
    />
  );
}
