import type { MediaType } from "@/lib/tmdb/types";

export interface MediaRef {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  rating?: number;
}

export interface Favorite extends MediaRef {
  addedAt: string;
}

export interface WatchHistoryItem extends MediaRef {
  progress: number; // seconds
  duration: number; // seconds (0 when unknown)
  lastWatchedAt: string;
  completed: boolean;
  season?: number;
  episode?: number;
}

export interface WatchProgress {
  progress: number; // seconds
  duration: number; // seconds (0 when unknown)
  updatedAt: string;
  completed: boolean;
}

export interface ListItem {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  rating?: number;
  position: number;
  createdAt: string;
}

export interface UserList {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  items: ListItem[];
}
