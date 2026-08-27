import type { PlaybackProvider, PlayContext } from "./types";
import { getEmbedSources } from "./embed-providers";

const embedProvider: PlaybackProvider = {
  id: "embed",
  label: "Embed Providers",
  async getSources({ tmdbId, ...rest }: PlayContext) {
    if (tmdbId == null) return [];
    return getEmbedSources({ ...rest, tmdbId });
  },
};

let provider: PlaybackProvider = embedProvider;

export function setPlaybackProvider(custom: PlaybackProvider) {
  provider = custom;
}

export function getPlaybackProvider(): PlaybackProvider {
  return provider;
}
