import type { Metadata } from "next";
import { HistoryView } from "@/components/history-view";

export const metadata: Metadata = {
  title: "Watch History",
  description: "Titles you recently watched.",
  alternates: { canonical: "/history" },
  robots: { index: false },
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Watch History
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Recently watched on this device, newest first.
      </p>
      <div className="mt-8">
        <HistoryView />
      </div>
    </div>
  );
}
