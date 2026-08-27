import type { Metadata } from "next";
import { WatchlistView } from "@/components/watchlist-view";

export const metadata: Metadata = {
  title: "Your Watchlist",
  description: "Movies and shows you saved for later.",
  alternates: { canonical: "/watchlist" },
  robots: { index: false },
};

export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Your Watchlist
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Saved on this device — pick up right where you left off.
      </p>
      <div className="mt-8">
        <WatchlistView />
      </div>
    </div>
  );
}
