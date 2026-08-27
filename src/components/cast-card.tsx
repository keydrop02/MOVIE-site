import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { CastMember } from "@/lib/api/types";

export function CastCard({ member }: { member: CastMember }) {
  const profile = tmdbImage(member.profilePath, "profile", "sm");
  return (
    <Link
      href={`/person/${member.id}`}
      className="group flex w-24 shrink-0 flex-col items-center gap-2 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      <span className="relative block size-24 overflow-hidden rounded-full border border-border bg-surface transition group-hover:border-gold/60">
        {profile ? (
          <Image
            src={profile}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-xl text-faint">
            {member.name.charAt(0)}
          </span>
        )}
      </span>
      <span>
        <span className="block line-clamp-1 text-xs font-medium text-foreground group-hover:text-gold">
          {member.name}
        </span>
        {member.character && (
          <span className="block line-clamp-1 text-xs text-faint">
            {member.character}
          </span>
        )}
      </span>
    </Link>
  );
}

export function CastRail({ cast }: { cast: CastMember[] }) {
  if (!cast.length) return null;
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
      {cast.slice(0, 18).map((member) => (
        <CastCard key={`${member.id}-${member.order}`} member={member} />
      ))}
    </div>
  );
}
