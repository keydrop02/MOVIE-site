"use client";

import { useEffect, useRef } from "react";
import type { MediaType } from "@/lib/tmdb/types";
import { useLibrary } from "@/lib/storage/library-context";

interface WatchRecorderProps {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  rating?: number;
  season?: number;
  episode?: number;
}

export function WatchRecorder({
  mediaType,
  tmdbId,
  title,
  posterPath,
  rating,
  season,
  episode,
}: WatchRecorderProps) {
  const { addToHistory } = useLibrary();
  const addToHistoryRef = useRef(addToHistory);
  addToHistoryRef.current = addToHistory;

  useEffect(() => {
    addToHistoryRef.current(
      { tmdbId, mediaType, title, posterPath, rating },
      0,
      0,
      mediaType === "tv" ? { season, episode } : undefined
    );
  }, [mediaType, tmdbId, title, posterPath, rating, season, episode]);

  return null;
}