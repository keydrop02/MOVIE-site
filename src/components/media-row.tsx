"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MediaRow({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows]);

  const scrollBy = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="absolute -top-9 right-0 z-20 hidden items-center gap-2 md:flex">
        <RailButton disabled={!canScrollLeft} onClick={() => scrollBy(-1)}>
          <ChevronLeft className="size-5" aria-hidden />
          <span className="sr-only">Scroll left</span>
        </RailButton>
        <RailButton disabled={!canScrollRight} onClick={() => scrollBy(1)}>
          <ChevronRight className="size-5" aria-hidden />
          <span className="sr-only">Scroll right</span>
        </RailButton>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mt-3 flex snap-x gap-3 overflow-x-auto scroll-smooth pt-3 pb-4 sm:gap-4"
      >
        {children}
      </div>
    </div>
  );
}

function RailButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-border-strong bg-background/80 text-foreground shadow-lg backdrop-blur transition",
        "hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        "disabled:pointer-events-none disabled:opacity-30"
      )}
    >
      {children}
    </button>
  );
}
