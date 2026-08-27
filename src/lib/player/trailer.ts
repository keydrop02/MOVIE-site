import type { PlaybackSource } from "./types";

/** Build an embeddable playback source for a YouTube trailer key. */
export function trailerPlaybackSource(key: string): PlaybackSource {
  return {
    id: "trailer",
    label: "Trailer",
    kind: "embed",
    url: `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`,
  };
}

/** True when the `?trailer` query flag requests trailer playback. */
export function wantsTrailer(value: string | string[] | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}
