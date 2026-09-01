"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MediaType } from "@/lib/tmdb/types";
import {
  Favorite,
  ListItem,
  MediaRef,
  UserList,
  WatchHistoryItem,
  WatchProgress,
} from "@/lib/storage/types";
import { keyOf, loadJson, saveJson } from "@/lib/storage/storage";

const FAVORITES_KEY = "favorites";
const LISTS_KEY = "lists";
const HISTORY_KEY = "history";
const PROGRESS_KEY = "watch-progress";

const COMPLETED_THRESHOLD = 0.9;

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

interface LibraryContextValue {
  favorites: Favorite[];
  lists: UserList[];
  history: WatchHistoryItem[];
  progress: Record<string, WatchProgress>;

  isFavorite: (mediaType: MediaType, tmdbId: number) => boolean;
  toggleFavorite: (ref: MediaRef) => void;

  createList: (name: string, description?: string) => UserList | null;
  updateList: (id: string, patch: { name?: string; description?: string }) => void;
  deleteList: (id: string) => void;
  addToList: (listId: string, ref: MediaRef) => boolean;
  removeFromList: (listId: string, itemId: string) => void;
  reorderList: (listId: string, itemIds: string[]) => void;

  recordWatchProgress: (ref: MediaRef, progressSeconds: number, duration: number) => void;
  addToHistory: (
    ref: MediaRef,
    progressSeconds: number,
    duration: number,
    context?: { season?: number; episode?: number }
  ) => void;
  clearHistory: () => void;
  removeFromHistory: (mediaType: MediaType, tmdbId: number) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>(() =>
    loadJson<Favorite[]>(FAVORITES_KEY, [])
  );
  const [lists, setLists] = useState<UserList[]>(() =>
    loadJson<UserList[]>(LISTS_KEY, [])
  );
  const [history, setHistory] = useState<WatchHistoryItem[]>(() =>
    loadJson<WatchHistoryItem[]>(HISTORY_KEY, [])
  );
  const [progress, setProgress] = useState<Record<string, WatchProgress>>(() =>
    loadJson<Record<string, WatchProgress>>(PROGRESS_KEY, {})
  );

  const persistFavorites = (next: Favorite[]) => {
    setFavorites(next);
    saveJson(FAVORITES_KEY, next);
  };
  const persistLists = (next: UserList[]) => {
    setLists(next);
    saveJson(LISTS_KEY, next);
  };
  const persistHistory = (next: WatchHistoryItem[]) => {
    setHistory(next);
    saveJson(HISTORY_KEY, next);
  };
  const persistProgress = (next: Record<string, WatchProgress>) => {
    setProgress(next);
    saveJson(PROGRESS_KEY, next);
  };

  const isFavorite = useCallback(
    (mediaType: MediaType, tmdbId: number) =>
      favorites.some(
        (f) => f.mediaType === mediaType && f.tmdbId === tmdbId
      ),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (ref: MediaRef) => {
      const exists = favorites.some(
        (f) => f.mediaType === ref.mediaType && f.tmdbId === ref.tmdbId
      );
      if (exists) {
        persistFavorites(
          favorites.filter(
            (f) => !(f.mediaType === ref.mediaType && f.tmdbId === ref.tmdbId)
          )
        );
      } else {
        persistFavorites([
          { ...ref, addedAt: new Date().toISOString() },
          ...favorites,
        ]);
      }
    },
    [favorites]
  );

  const createList = useCallback(
    (name: string, description = ""): UserList | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const now = new Date().toISOString();
      const list: UserList = {
        id: uid(),
        name: trimmed,
        description: description.trim(),
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      persistLists([list, ...lists]);
      return list;
    },
    [lists]
  );

  const updateList = useCallback(
    (id: string, patch: { name?: string; description?: string }) => {
      persistLists(
        lists.map((l) =>
          l.id === id
            ? { ...l, ...patch, updatedAt: new Date().toISOString() }
            : l
        )
      );
    },
    [lists]
  );

  const deleteList = useCallback(
    (id: string) => {
      persistLists(lists.filter((l) => l.id !== id));
    },
    [lists]
  );

  const addToList = useCallback(
    (listId: string, ref: MediaRef): boolean => {
      let added = false;
      const next = lists.map((l) => {
        if (l.id !== listId) return l;
        if (l.items.some((it) => it.tmdbId === ref.tmdbId && it.mediaType === ref.mediaType)) {
          return l;
        }
        added = true;
        const item: ListItem = {
          id: uid(),
          ...ref,
          position: l.items.length,
          createdAt: new Date().toISOString(),
        };
        return { ...l, items: [...l.items, item], updatedAt: new Date().toISOString() };
      });
      persistLists(next);
      return added;
    },
    [lists]
  );

  const removeFromList = useCallback(
    (listId: string, itemId: string) => {
      persistLists(
        lists.map((l) =>
          l.id === listId
            ? {
                ...l,
                items: l.items.filter((it) => it.id !== itemId),
                updatedAt: new Date().toISOString(),
              }
            : l
        )
      );
    },
    [lists]
  );

  const reorderList = useCallback(
    (listId: string, itemIds: string[]) => {
      persistLists(
        lists.map((l) => {
          if (l.id !== listId) return l;
          const map = new Map(l.items.map((it) => [it.id, it]));
          const reordered = itemIds
            .map((id, position) => {
              const item = map.get(id);
              return item ? { ...item, position } : null;
            })
            .filter(Boolean) as ListItem[];
          return { ...l, items: reordered, updatedAt: new Date().toISOString() };
        })
      );
    },
    [lists]
  );

  const recordWatchProgress = useCallback(
    (ref: MediaRef, progressSeconds: number, duration: number) => {
      const completed =
        duration > 0 && progressSeconds / duration >= COMPLETED_THRESHOLD;
      const entry: WatchProgress = {
        progress: progressSeconds,
        duration,
        updatedAt: new Date().toISOString(),
        completed,
      };
      persistProgress({ ...progress, [keyOf(ref.mediaType, ref.tmdbId)]: entry });
    },
    [progress]
  );

  const addToHistory = useCallback(
    (ref: MediaRef, progressSeconds: number, duration: number, context?: { season?: number; episode?: number }) => {
      const completed =
        duration > 0 && progressSeconds / duration >= COMPLETED_THRESHOLD;
      const now = new Date().toISOString();
      const existing = history.find(
        (h) => h.mediaType === ref.mediaType && h.tmdbId === ref.tmdbId
      );
      let next: WatchHistoryItem[];
      if (existing) {
        next = history.map((h) =>
          h.mediaType === ref.mediaType && h.tmdbId === ref.tmdbId
            ? {
                ...h,
                progress: progressSeconds,
                duration,
                lastWatchedAt: now,
                completed: existing.completed || completed,
                season: context?.season ?? h.season,
                episode: context?.episode ?? h.episode,
              }
            : h
        );
      } else {
        next = [
          {
            ...ref,
            progress: progressSeconds,
            duration,
            lastWatchedAt: now,
            completed,
            season: context?.season,
            episode: context?.episode,
          },
          ...history,
        ];
      }
      persistHistory(next);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, []);

  const removeFromHistory = useCallback(
    (mediaType: MediaType, tmdbId: number) => {
      persistHistory(
        history.filter((h) => !(h.mediaType === mediaType && h.tmdbId === tmdbId))
      );
    },
    [history]
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      favorites,
      lists,
      history,
      progress,
      isFavorite,
      toggleFavorite,
      createList,
      updateList,
      deleteList,
      addToList,
      removeFromList,
      reorderList,
      recordWatchProgress,
      addToHistory,
      clearHistory,
      removeFromHistory,
    }),
    [
      favorites,
      lists,
      history,
      progress,
      isFavorite,
      toggleFavorite,
      createList,
      updateList,
      deleteList,
      addToList,
      removeFromList,
      reorderList,
      recordWatchProgress,
      addToHistory,
      clearHistory,
      removeFromHistory,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }
  return ctx;
}
