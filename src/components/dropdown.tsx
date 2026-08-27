"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom listbox dropdown — replaces native <select> so the open panel can be
 * fully styled. Keyboard: Enter/Space toggles, arrows/Home/End move, Esc closes.
 */
export function Dropdown({
  value,
  options,
  onChange,
  className,
  ariaLabel,
  disabled,
  placeholder,
  leading,
  menuClassName,
}: {
  value: string;
  options: {
    value: string;
    label: string;
    danger?: boolean;
    /** Optional element rendered before the label. */
    icon?: React.ReactNode;
    /** Renders a hairline separator above this option. */
    divider?: boolean;
  }[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  /** Shown in the trigger when `value` matches no option. */
  placeholder?: string;
  /** Optional element rendered before the trigger label. */
  leading?: React.ReactNode;
  /** Overrides the open menu's width (defaults to the widest option, never narrower than the trigger). */
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const commit = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const nodes = listRef.current?.querySelectorAll("[role='option']");
    nodes?.[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const openMenu = () => {
    const index = options.findIndex((option) => option.value === value);
    setActiveIndex(index >= 0 ? index : 0);
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) {
          if (activeIndex >= 0 && activeIndex < options.length) commit(activeIndex);
        } else {
          openMenu();
        }
        break;
      case "Escape":
        setOpen(false);
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex cursor-pointer items-center gap-2 text-left transition",
          "hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          disabled && "cursor-default opacity-60",
          className
        )}
      >
        {leading}
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.label : (placeholder ?? options[0]?.label)}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 text-muted transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
            className={cn(
              "absolute top-full left-0 z-50 mt-2 max-h-72 max-w-[calc(100vw-2rem)] min-w-full overflow-y-auto rounded-xl border border-border-strong bg-surface p-1.5 shadow-2xl shadow-black/60",
              menuClassName ?? "w-max"
            )}
        >
          {options.map((option, index) => (
            <Fragment key={option.value || "__all__"}>
              {option.divider && (
                <div role="separator" className="my-1 h-px bg-border" />
              )}
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  option.danger
                    ? "text-red-400 hover:bg-card hover:text-red-300"
                    : option.value === value
                      ? "bg-gold/10 font-medium text-gold"
                      : index === activeIndex
                        ? "bg-card text-foreground"
                        : "text-muted hover:text-foreground"
                )}
              >
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.value === value && <Check aria-hidden className="size-4 shrink-0" />}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
