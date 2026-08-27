import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getPerson } from "@/lib/api/people";
import type { PersonDetail } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { tmdbImage, tmdbImageAbsolute } from "@/lib/images";
import { MediaGrid } from "@/components/media-grid";
import { SectionHeader } from "@/components/section-header";

export const revalidate = 21600;

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function loadPersonUncached(id: string): Promise<PersonDetail> {
  const parsed = parseId(id);
  if (!parsed) notFound();
  try {
    return await getPerson(parsed);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// Deduped per request so generateMetadata + page share one upstream fetch.
const loadPerson = cache(loadPersonUncached);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // Intentionally unguarded: a missing person throws notFound() here, which
  // lets Next respond with a proper 404 status before streaming begins.
  const person = await loadPerson(id);

  const description =
    person.biography?.slice(0, 160) ??
    `Filmography and profile for ${person.name}.`;

  return {
    title: person.name,
    description,
    alternates: { canonical: `/person/${id}` },
    openGraph: {
      title: person.name,
      description,
      url: `/person/${id}`,
      images: tmdbImageAbsolute(person.profilePath, "profile", "md")
        ? [{ url: tmdbImageAbsolute(person.profilePath, "profile", "md")! }]
        : undefined,
    },
  };
}

export default async function PersonPage({ params }: PageProps) {
  const { id } = await params;
  const person = await loadPerson(id);

  const profile = tmdbImage(person.profilePath, "profile", "md");
  const filmography = [
    ...person.credits.cast.map((item) => ({
      ...item,
      credit: item.character ? `as ${item.character}` : undefined,
    })),
    ...person.credits.crew.map((item) => ({
      ...item,
      credit: item.job,
    })),
  ].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));

  const seen = new Set<number>();
  const uniqueFilmography = filmography.filter((item) => {
    if (seen.has(item.tmdbId)) return false;
    seen.add(item.tmdbId);
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="relative aspect-[2/3] overflow-hidden rounded-card border border-border bg-card">
            {profile ? (
              <Image
                src={tmdbImage(person.profilePath, "profile", "md") ?? ""}
                alt={person.name}
                fill
                sizes="280px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-5xl text-faint">
                {person.name.charAt(0)}
              </div>
            )}
          </div>

          <dl className="mt-6 space-y-4 text-sm">
            {person.knownForDepartment && (
              <div>
                <dt className="font-mono text-xs tracking-widest text-faint uppercase">
                  Known for
                </dt>
                <dd className="mt-1 text-muted">{person.knownForDepartment}</dd>
              </div>
            )}
            {person.birthday && (
              <div>
                <dt className="font-mono text-xs tracking-widest text-faint uppercase">
                  Born
                </dt>
                <dd className="mt-1 text-muted">
                  {formatDate(person.birthday)}
                  {person.placeOfBirth ? ` · ${person.placeOfBirth}` : ""}
                </dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt className="font-mono text-xs tracking-widest text-faint uppercase">
                  Died
                </dt>
                <dd className="mt-1 text-muted">{formatDate(person.deathday)}</dd>
              </div>
            )}
            {person.alsoKnownAs.length > 0 && (
              <div>
                <dt className="font-mono text-xs tracking-widest text-faint uppercase">
                  Also known as
                </dt>
                <dd className="mt-1 text-muted">{person.alsoKnownAs.slice(0, 4).join(", ")}</dd>
              </div>
            )}
          </dl>
        </aside>

        <div className="min-w-0 space-y-10">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {person.name}
            </h1>
            {person.biography && (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-zinc-300 sm:text-base">
                {person.biography}
              </p>
            )}
          </header>

          {person.knownFor.length > 0 && (
            <section aria-label="Known for">
              <SectionHeader title="Known For" />
              <MediaGrid items={person.knownFor} />
            </section>
          )}

          {uniqueFilmography.length > 0 && (
            <section aria-label="Filmography">
              <SectionHeader title={`Filmography (${uniqueFilmography.length})`} />
              <ul className="divide-y divide-border rounded-card border border-border bg-card">
                {uniqueFilmography.slice(0, 60).map((credit) => (
                  <li key={`${credit.id}-${credit.tmdbId}`}>
                    <a
                      href={`/${credit.type}/${credit.tmdbId}`}
                      className="flex items-baseline gap-x-4 px-5 py-3 transition hover:bg-surface/60"
                    >
                      <span className="w-14 shrink-0 font-mono text-xs text-faint">
                        {credit.year ?? "—"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {credit.title}
                      </span>
                      <span className="hidden truncate text-xs text-muted sm:block sm:max-w-[220px]">
                        {credit.credit}
                      </span>
                      <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint uppercase">
                        {credit.type === "tv" ? "TV" : "Film"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
