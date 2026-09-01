"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { EpisodeList, EpisodeListSkeleton } from "@/components/episodes/episode-list";
import type { TMDbEpisode, TMDbSeason } from "@/lib/tmdb/types";

interface EpisodeListWithUrlProps {
  tvId: number;
  seasons: TMDbSeason[];
  initialSeasonNumber: number;
  initialEpisodes: TMDbEpisode[];
  activeEpisode?: number;
}

export function EpisodeListWithUrl({
  tvId,
  seasons,
  initialSeasonNumber,
  initialEpisodes,
  activeEpisode,
}: EpisodeListWithUrlProps) {
  const router = useRouter();

  const onSeasonChange = useCallback(
    (seasonNumber: number, episodeNumber: number) => {
      router.replace(`/watch?type=tv&id=${tvId}&season=${seasonNumber}&episode=${episodeNumber}`, {
        scroll: false,
      });
    },
    [router, tvId]
  );

  return (
    <EpisodeList
      tvId={tvId}
      seasons={seasons}
      initialSeasonNumber={initialSeasonNumber}
      initialEpisodes={initialEpisodes}
      activeEpisode={activeEpisode}
      onSeasonChange={onSeasonChange}
      containerClassName="w-full"
    />
  );
}

export function EpisodeListSkeletonWithUrl(props: { count?: number }) {
  return <EpisodeListSkeleton {...props} />;
}