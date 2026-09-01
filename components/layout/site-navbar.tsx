"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Settings,
  Home,
  Film,
  Tv,
  List,
  Clock,
  Sparkles,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { Popover } from "@/components/ui/popover";
import { Logo } from "@/components/layout/logo";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/tv", label: "TV Shows", icon: Tv },
  { href: "/anime", label: "Anime", icon: Sparkles },
  { href: "/lists", label: "My List", icon: List },
];

const MOBILE_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/search", label: "Search", icon: Search },
  { href: "/tv", label: "TV Shows", icon: Tv },
  { href: "/anime", label: "Anime", icon: Sparkles },
  { href: "/lists", label: "My List", icon: List },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/lists") return pathname === "/lists" || pathname.startsWith("/lists");
  return pathname.startsWith(href);
}

export function SiteNavbar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const accountActive =
    pathname.startsWith("/settings") || pathname.startsWith("/history");
  const itemCls =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-secondary transition-colors hover:bg-white/[0.06] hover:text-foreground";

  return (
    <>
      {/* Brand logo — top left (mobile, no floating pill) */}
      <Link
        href="/"
        aria-label={`${SITE.name} home`}
        className="fixed left-5 top-[18px] z-50 sm:hidden md:left-10"
      >
        <Logo />
      </Link>

      {/* Floating top nav (desktop) */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden justify-center px-5 pt-4 sm:flex md:px-10">
        <div className="pointer-events-auto relative w-full">
          <Link
            href="/"
            aria-label={`${SITE.name} home`}
            className="absolute left-5 top-1/2 -translate-y-1/2 md:left-10"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Main navigation"
            className={cn(
              "pointer-events-auto mx-auto flex w-fit max-w-[980px] items-center gap-1 rounded-full",
              "border border-white/10 bg-black/60 py-2 pl-3 pr-2 backdrop-blur-xl shadow-lg shadow-black/40"
            )}
          >
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200",
                    active
                      ? "bg-white font-medium text-black"
                      : "text-secondary hover:bg-white/[0.08] hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/search"
              aria-label="Search"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                pathname.startsWith("/search")
                  ? "bg-white text-black"
                  : "text-secondary hover:bg-white/[0.08] hover:text-foreground"
              )}
            >
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <Popover
              open={moreOpen}
              onOpenChange={setMoreOpen}
              align="end"
              label="Account"
              trigger={
                <button
                  type="button"
                  aria-label="Account"
                  aria-haspopup="menu"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                    accountActive
                      ? "bg-white text-black"
                      : "text-secondary hover:bg-white/[0.08] hover:text-foreground"
                  )}
                >
                  <svg
                    viewBox="0 0 640 640"
                    fill="currentColor"
                    aria-hidden
                    className="h-[18px] w-[18px]"
                  >
                    <path d="M96 320C96 289.1 121.1 264 152 264C182.9 264 208 289.1 208 320C208 350.9 182.9 376 152 376C121.1 376 96 350.9 96 320zM264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320zM488 264C518.9 264 544 289.1 544 320C544 350.9 518.9 376 488 376C457.1 376 432 350.9 432 320C432 289.1 457.1 264 488 264z" />
                  </svg>
                </button>
              }
            >
              <Link
                href="/history"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  itemCls,
                  pathname.startsWith("/history") && "text-accent"
                )}
              >
                <Clock className="h-4 w-4" aria-hidden />
                History
              </Link>
              <Link
                href="/settings"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  itemCls,
                  pathname.startsWith("/settings") && "text-accent"
                )}
              >
                <Settings className="h-4 w-4" aria-hidden />
                Settings
              </Link>
              <Link
                href="/legal"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  itemCls,
                  pathname.startsWith("/legal") && "text-accent"
                )}
              >
                <Scale className="h-4 w-4" aria-hidden />
                Legal
              </Link>
            </Popover>
          </div>
        </nav>
      </div>
      </header>



      {/* Mobile bottom nav */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:hidden"
      >
        <div className="flex w-full max-w-md items-center justify-around rounded-full border border-white/10 bg-black/70 px-2 py-1.5 backdrop-blur-xl shadow-lg shadow-black/40">
          {MOBILE_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 transition-colors duration-200",
                  active ? "bg-white text-black" : "text-secondary"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
