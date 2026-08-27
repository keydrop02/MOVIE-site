import "server-only";
import { normalizeMedia } from "./normalize";
import { getPersonCombinedCredits, getPersonDetail } from "./tmdb";
import type { MediaItem, PersonDetail } from "./types";

export async function getPerson(id: number | string): Promise<PersonDetail> {
  const [detail, credits] = await Promise.all([
    getPersonDetail(id),
    getPersonCombinedCredits(id).catch(() => null),
  ]);

  const cast =
    credits?.cast
      ?.filter((c) => c.media_type === "movie" || c.media_type === "tv")
      .map((credit) => ({
        ...normalizeMedia(credit, credit.media_type),
        character: credit.character,
      }))
      .sort(sortByDateDesc) ?? [];

  const crew =
    credits?.crew
      ?.filter((c) => c.media_type === "movie" || c.media_type === "tv")
      .map((credit) => ({
        ...normalizeMedia(credit, credit.media_type),
        job: credit.job,
      }))
      .sort(sortByDateDesc) ?? [];

  return {
    id: detail.id,
    name: detail.name,
    profilePath: detail.profile_path ?? undefined,
    knownForDepartment: detail.known_for_department,
    knownFor: dedupeById(cast).slice(0, 8),
    biography: detail.biography?.trim() || undefined,
    birthday: detail.birthday ?? undefined,
    deathday: detail.deathday ?? undefined,
    placeOfBirth: detail.place_of_birth ?? undefined,
    alsoKnownAs: detail.also_known_as ?? [],
    credits: {
      cast: dedupeById(cast),
      crew: dedupeById(crew),
    },
  };
}

function sortByDateDesc(
  a: MediaItem & { releaseDate?: string },
  b: MediaItem & { releaseDate?: string }
) {
  return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
}

function dedupeById<T extends { tmdbId: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.tmdbId)) return false;
    seen.add(item.tmdbId);
    return true;
  });
}
