"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Clock,
  Clapperboard,
  Menu,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./search-overlay";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV Shows" },
  { href: "/anime", label: "Anime" },
  { href: "/trending", label: "Trending" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts();

  const openSearch = () => {
    setMenuOpen(false);
    setSearchMounted(true);
    setSearchOpen(true);
  };
  const closeSearch = () => setSearchOpen(false);

  const closeMenu = () => setMenuOpen(false);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menuOpen]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          menuOpen
            ? "border-border bg-background/90 backdrop-blur-lg"
            : "border-transparent bg-background/60 backdrop-blur-sm"
        )}
      >
        <div
          className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8"
        >
          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            aria-label="Movieo home"
          >
            <Clapperboard className="size-6 text-gold" aria-hidden />
            <span className="text-lg font-bold tracking-tight text-foreground">
              MOVIEO
            </span>
          </Link>

          {/* ── Desktop nav (after logo) ── */}
          <nav
            aria-label="Primary"
            className="ml-8 hidden items-center gap-1 md:flex"
          >
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "relative px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                        active
                          ? "text-foreground"
                          : "text-muted hover:text-foreground"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gold"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ── Search bar (centered between nav and icons) ── */}
          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <button
              type="button"
              id="site-search-desktop"
              onClick={openSearch}
              aria-haspopup="dialog"
              aria-label="Search movies and shows"
              className={cn(
                "w-full max-w-lg items-center gap-2.5 rounded-full border px-4 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold flex",
                searchOpen
                  ? "border-border-strong bg-surface text-foreground"
                  : "border-border bg-card text-faint hover:border-border-strong hover:text-muted"
              )}
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span>Search…</span>
            </button>
          </div>

          {/* ── Right icons ── */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/watchlist"
              aria-label="Watchlist"
              className={cn(
                "hidden rounded-full p-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:flex",
                isActive("/watchlist")
                  ? "text-gold"
                  : "text-muted hover:bg-surface/60 hover:text-foreground"
              )}
            >
              <Bookmark
                className="size-5"
                aria-hidden
              />
            </Link>

            {/* History — desktop only */}
            <Link
              href="/history"
              aria-label="Watch history"
              className={cn(
                "hidden rounded-full p-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:flex",
                isActive("/history")
                  ? "text-gold"
                  : "text-muted hover:bg-surface/60 hover:text-foreground"
              )}
            >
              <Clock
                className="size-5"
                aria-hidden
              />
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={cn(
                "rounded-full p-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:hidden",
                menuOpen
                  ? "text-foreground bg-surface"
                  : "text-muted hover:bg-surface/60 hover:text-foreground"
              )}
            >
              {menuOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        <div
          ref={menuRef}
          id="mobile-nav"
          aria-label="Mobile"
          className={cn(
            "md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-lg transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            menuOpen
              ? "max-h-[80vh] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none border-t-transparent"
          )}
        >
          <div className="px-4 pt-3 pb-5 space-y-1">
            {/* Search bar */}
            <button
              type="button"
              onClick={openSearch}
              aria-haspopup="dialog"
              className="mb-3 flex w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-left text-sm text-faint transition hover:border-border-strong hover:text-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
            >
            <Search className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Search movies, shows, people…</span>
            </button>

            {/* Primary nav */}
            <nav aria-label="Mobile primary">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        className={cn(
                          "relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition",
                          active
                            ? "text-foreground"
                            : "text-muted hover:bg-surface/60 hover:text-foreground"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gold"
                          />
                        )}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Divider */}
            <div className="my-2 h-px bg-border" />

            {/* Secondary actions */}
            <nav aria-label="Mobile secondary">
              <ul className="flex flex-col">
                <li>
                  <Link
                    href="/watchlist"
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive("/watchlist")
                        ? "text-gold"
                        : "text-muted hover:bg-surface/60 hover:text-foreground"
                    )}
                  >
                    <Bookmark
                      className="size-4"
                      aria-hidden
                    />
                    Watchlist
                  </Link>
                </li>
                <li>
                  <Link
                    href="/history"
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive("/history")
                        ? "text-gold"
                        : "text-muted hover:bg-surface/60 hover:text-foreground"
                    )}
                  >
                    <Clock
                      className="size-4"
                      aria-hidden
                    />
                    History
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {searchMounted && <SearchOverlay open={searchOpen} onClose={closeSearch} />}
    </>
  );
}
