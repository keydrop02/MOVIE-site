"use client";

import { useEffect } from "react";

function isFormField(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

function isPlayerScope(el: Element | null): boolean {
  return Boolean(el?.closest("[data-player]"));
}

function getPlayerVideo(): HTMLVideoElement | null {
  return document.querySelector("[data-player] video") as HTMLVideoElement | null;
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isFormField(e.target as Element)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "/": {
          e.preventDefault();
          const overlay = document.getElementById("overlay-search-input");
          if (overlay) {
            overlay.focus();
            return;
          }
          const pageInput = document.getElementById("search-input");
          if (pageInput) {
            pageInput.focus();
            return;
          }
          const trigger = document.getElementById("site-search-desktop");
          if (trigger) trigger.click();
          break;
        }
        case "Escape": {
          const active = document.activeElement;
          if (
            active instanceof HTMLElement &&
            active.id !== "overlay-search-input" &&
            active !== document.body
          ) {
            active.blur();
          }
          break;
        }
        case " ": {
          if (isPlayerScope(e.target as Element)) {
            e.preventDefault();
            const v = getPlayerVideo();
            if (v) (v.paused ? v.play() : v.pause());
          }
          break;
        }
        case "ArrowLeft": {
          if (isPlayerScope(e.target as Element)) {
            e.preventDefault();
            const v = getPlayerVideo();
            if (v) v.currentTime = Math.max(0, v.currentTime - 10);
          }
          break;
        }
        case "ArrowRight": {
          if (isPlayerScope(e.target as Element)) {
            e.preventDefault();
            const v = getPlayerVideo();
            if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          }
          break;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
