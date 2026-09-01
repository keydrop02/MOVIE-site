import type { Metadata } from "next";
import { Scale, BookOpen, FileWarning, Database } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Legal" };

export default function LegalPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Legal
        </h1>
        <p className="mt-1 text-sm text-muted">
          Terms, privacy, and disclaimers for {SITE.name}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <h2 className="font-semibold text-foreground">Terms of Use</h2>
              <p className="mt-1 text-sm text-secondary">
                {SITE.name} is an editorial cinematic discovery platform. By using this site you
                agree to use it only for personal, non-commercial purposes. You may not
                redistribute, re-host, or republish the content or data shown here without
                permission, and you must not attempt to sell access to the service. Content and
                features may change or be removed at any time without notice.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <h2 className="font-semibold text-foreground">Privacy</h2>
              <p className="mt-1 text-sm text-secondary">
                {SITE.name} has no accounts and stores nothing on a server. Your favorites,
                lists, watch history, and viewing progress are kept entirely in your own
                browser&apos;s local storage on this device. No personal data is collected,
                tracked, or shared with third parties by the site itself.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <div className="flex items-start gap-3">
            <FileWarning className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <h2 className="font-semibold text-foreground">Disclaimer</h2>
              <p className="mt-1 text-sm text-secondary">
                {SITE.name} is provided &quot;as is&quot; without warranties of any kind, and we
                are not responsible for decisions made based on the information presented here.
                The service is intended for personal use only and does not host, stream, or
                distribute any movies or shows directly.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
            <div>
              <h2 className="font-semibold text-foreground">Third-Party Data</h2>
              <p className="mt-1 text-sm text-secondary">
                Movie and TV metadata and images are provided by a third-party API and may be
                subject to change. Trademarks and copyrighted works shown are the property of
                their respective owners and are used here for informational purposes only.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
