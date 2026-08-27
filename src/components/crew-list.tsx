import type { CrewMember } from "@/lib/api/types";

const FEATURED_JOBS = ["Director", "Screenplay", "Writer", "Story", "Original Music Composer", "Creator"] as const;

/** Key crew credits grouped by job (Director, Writers, Composer…). */
export function CrewList({ crew }: { crew: CrewMember[] }) {
  const groups = new Map<string, string[]>();

  for (const job of FEATURED_JOBS) {
    const names = crew.filter((c) => c.job === job).map((c) => c.name);
    if (names.length) groups.set(job === "Original Music Composer" ? "Music" : job, names);
  }

  if (!groups.size) return null;

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4">
      {[...groups.entries()].map(([job, names]) => (
        <div key={job}>
          <dt className="font-mono text-xs tracking-widest text-faint uppercase">
            {job}
          </dt>
          <dd className="mt-1 text-sm text-muted">{names.join(", ")}</dd>
        </div>
      ))}
    </dl>
  );
}
