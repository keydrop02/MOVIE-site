import type { Metadata } from "next";
import { Shield, Database, Heart, Clock, ListIcon } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">Your data is stored locally on this device.</p>
      </header>

      <div className="space-y-4">
        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <h2 className="font-semibold text-foreground">Privacy-First by Design</h2>
              <p className="mt-1 text-sm text-secondary">
                Movieo has no accounts and no servers storing your data. Everything you save —
                favorites, lists, watch history, and progress — lives only in your browser&apos;s
                local storage on this device.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <h2 className="font-semibold text-foreground">Local Data</h2>
              <p className="mt-1 text-sm text-secondary">
                Clearing your browser data or using a different device will start fresh. Data is
                stored under the <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">movieo:*</code>{" "}
                keys in local storage.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <h2 className="mb-3 font-semibold text-foreground">Manage Your Library</h2>
          <ul className="space-y-2.5 text-sm text-secondary">
            <li className="flex items-center gap-3">
              <Heart className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span>Favorites — saved titles with the heart icon</span>
            </li>
            <li className="flex items-center gap-3">
              <ListIcon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span>Lists — custom collections you create and manage</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span>History — titles you&apos;ve watched, with progress tracking</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
