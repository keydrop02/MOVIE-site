export type PlaybackKind = "hls" | "dash" | "mp4" | "embed";

export interface PlaybackSource {
  id: string;
  label: string;
  kind: PlaybackKind;
  url: string;
  /** If set, applied to the iframe's sandbox attribute. */
  sandbox?: string;
  /** If set, overrides the iframe's referrerPolicy. */
  referrerPolicy?: ReferrerPolicy;
}

export interface PlayContext {
  /** Content kind being played, keyed by TMDB ID (`tmdbId`). */
  type: "movie" | "tv";
  tmdbId?: number;
  title: string;
  season?: number;
  episode?: number;
}

/**
 * Contract for an authorized playback provider. The site ships with no
 * provider configured; implement this interface and register it in
 * `provider.ts` when a legitimate content source becomes available.
 */
export interface PlaybackProvider {
  id: string;
  label: string;
  /** Return the playable sources for the given context, or an empty array. */
  getSources(ctx: PlayContext): Promise<PlaybackSource[]>;
}
