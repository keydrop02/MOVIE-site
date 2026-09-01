"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  label?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
}

/**
 * Lightweight accessible popover with outside-click and Escape handling.
 * The dropdown is rendered through a portal to <body> so it is never clipped
 * by an `overflow-hidden` or transformed ancestor (e.g. detail page hero).
 */
export function Popover({
  trigger,
  children,
  align = "start",
  open,
  onOpenChange,
  className,
  contentClassName,
  label,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = React.useState<Rect | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
        onOpenChange?.(next);
      }
    },
    [isControlled, onOpenChange]
  );

  React.useEffect(() => {
    if (!isOpen) {
      setRect(null);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inside =
        (triggerRef.current && triggerRef.current.contains(target)) ||
        (contentRef.current && contentRef.current.contains(target));
      if (!inside) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setOpen]);

  const style: React.CSSProperties | undefined =
    rect && align === "end"
      ? { position: "fixed", top: rect.top + 8, left: Math.max(8, rect.left + rect.width - 220) }
      : rect && align === "center"
        ? {
            position: "fixed",
            top: rect.top + 8,
            left: Math.max(8, rect.left + rect.width / 2 - 110),
          }
        : rect
          ? { position: "fixed", top: rect.top + 8, left: Math.max(8, rect.left) }
          : undefined;

  return (
    <div ref={triggerRef} className={cn("inline-flex", className)}>
      <div onClick={() => setOpen(!isOpen)}>{trigger}</div>
      {isOpen &&
        (typeof document !== "undefined"
          ? createPortal(
              <div
                ref={contentRef}
                role="menu"
                aria-label={label}
                style={style}
                onClick={(e) => {
                  const t = e.target as HTMLElement;
                  if (!t.closest("input, textarea, select")) setOpen(false);
                }}
                className={cn(
                  "z-[70] min-w-[220px] rounded-2xl border border-white/10 bg-surface-elevated/95 p-2 shadow-xl shadow-black/40 backdrop-blur-md",
                  contentClassName
                )}
              >
                {children}
              </div>,
              document.body
            )
          : null)}
    </div>
  );
}

export function PopoverItem({
  children,
  onClick,
  active,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-secondary transition-colors hover:bg-white/[0.06] hover:text-foreground",
        active && "bg-accent/[0.12] text-accent",
        className
      )}
    >
      {children}
    </button>
  );
}
