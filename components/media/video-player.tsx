"use client";

import { forwardRef, useState, useImperativeHandle } from "react";
import { MonitorPlay } from "lucide-react";
import type { PlaybackSource } from "@/lib/player/types";
import { cn } from "@/lib/utils";
import { SuperEmbedPlayer } from "@/components/media/superembed-player";

function SourceSelector({
  sources,
  activeId,
  onSelect,
}: {
  sources: PlaybackSource[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Playback sources" className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <button
          key={source.id}
          role="tab"
          type="button"
          aria-selected={source.id === activeId}
          onClick={() => onSelect(source.id)}
          className={cn(
            "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            source.id === activeId
              ? "border-accent bg-surface text-foreground"
              : "border-border bg-surface-elevated text-secondary hover:border-white/20 hover:text-foreground"
          )}
        >
          {source.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Client-side player shell. Renders whatever an authorized playback provider
 * returned; shows a neutral placeholder while no provider is configured.
 *
 * Exposes the underlying `<video>` element via ref (null for embed sources).
 */
export const VideoPlayer = forwardRef<
  HTMLVideoElement | null,
  {
    sources: PlaybackSource[];
    poster?: string | null;
    title: string;
  }
>(function VideoPlayer({ sources, poster, title }, ref) {
  const [activeId, setActiveId] = useState(sources[0]?.id ?? "");
  const active = sources.find((source) => source.id === activeId) ?? sources[0];
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React 19's useImperativeHandle rejects nullable returns; the ref is intentionally nullable for embed sources
  useImperativeHandle(ref, () => videoEl as any, [videoEl]);

  if (!sources.length || !active) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-elevated">
          <MonitorPlay className="size-6 text-muted" aria-hidden />
        </span>
        <p className="max-w-sm px-6 text-sm text-muted">
          No playback source is configured yet. Connect an authorized content
          provider to enable streaming.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div data-player className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
        {active.kind === "embed" ? (
          <iframe
            src={active.url}
            title={`${title} — ${active.label}`}
            allowFullScreen
            referrerPolicy={active.referrerPolicy ?? "no-referrer"}
            sandbox={active.sandbox}
            className="absolute inset-0 size-full"
          />
        ) : active.kind === "superembed" && active.meta ? (
          <SuperEmbedPlayer meta={active.meta} title={title} />
        ) : (
          <video
            ref={setVideoEl}
            key={active.url}
            controls
            playsInline
            poster={poster ?? undefined}
            src={active.url}
            className="absolute inset-0 size-full"
          >
            Your browser does not support HTML video.
          </video>
        )}
      </div>

      {sources.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-secondary">
            Servers
          </p>
          <SourceSelector sources={sources} activeId={active.id} onSelect={setActiveId} />
        </div>
      )}
    </div>
  );
});