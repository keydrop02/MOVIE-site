"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, TriangleAlert } from "lucide-react";
import type { SuperEmbedMeta } from "@/lib/player/types";
import { cn } from "@/lib/utils";

interface SuperEmbedMirror {
  server: string;
  quality?: string;
  language?: string;
  url: string;
}

interface SourcesResponse {
  cached?: boolean;
  sources: SuperEmbedMirror[];
}

const MIRROR_SANDBOX = "allow-scripts allow-same-origin allow-forms";

/**
 * Base URL of the SuperEmbed player entry point.
 * When provided (NEXT_PUBLIC_SUPEREMBED_PLAYER_BASE, e.g.
 * "https://your-host.com/se_player.php") the fallback iframe points at your
 * self-hosted se_player.php. Otherwise it uses the local /api/stream proxy.
 */
const PLAYER_BASE = process.env.NEXT_PUBLIC_SUPEREMBED_PLAYER_BASE ?? "/api/stream";

function fallbackEmbedUrl(meta: SuperEmbedMeta): string {
  const p = new URLSearchParams({ video_id: String(meta.tmdbId), tmdb: "1" });
  if (meta.type === "tv") {
    p.set("s", String(meta.season ?? 1));
    p.set("e", String(meta.episode ?? 1));
  }
  const base = PLAYER_BASE.replace(/\/$/, "");
  return `${base}?${p.toString()}`;
}

/**
 * SuperEmbed custom player. Fetches the JSON Data Hub mirror list via
 * /api/stream/sources (SQLite-cached 48h) and renders a local server
 * selector instead of a rigid static iframe.
 */
export function SuperEmbedPlayer({
  meta,
  title,
}: {
  meta: SuperEmbedMeta;
  title: string;
}) {
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [error, setError] = useState<string>("");
  const [sources, setSources] = useState<SuperEmbedMirror[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = useMemo(() => {
    const p = new URLSearchParams({
      type: meta.type,
      id: String(meta.tmdbId),
      max_results: "5",
    });
    if (meta.type === "tv") {
      p.set("season", String(meta.season ?? 1));
      p.set("episode", String(meta.episode ?? 1));
    }
    return p.toString();
  }, [meta]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");
      try {
        const res = await fetch(`/api/stream/sources?${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        const data = (await res.json()) as SourcesResponse;
        if (cancelled) return;
        const deduped = data.sources.filter(
          (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i,
        );
        setSources(deduped);
        setActiveIndex(0);
        setStatus("ready");
      } catch (err) {
        if (cancelled || (err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query]);

  const active = sources[activeIndex] ?? null;

  if (status === "loading") {
    return (
      <div className="flex aspect-video w-full items-center justify-center gap-3 rounded-2xl border border-border bg-black text-secondary">
        <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
        <span className="text-sm">Loading SuperEmbed mirrors…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
          <iframe
            src={fallbackEmbedUrl(meta)}
            title={`${title} — SuperEmbed player`}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute inset-0 size-full"
          />
        </div>
        <p className="flex items-center gap-2 text-xs text-muted">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          The SuperEmbed mirror list is unavailable right now
          {error && <span className="hidden sm:inline">({error})</span>} — using its default
          themed player instead.
        </p>
        <p className="flex items-center gap-2 text-xs text-muted">
          If the player is blocked by its host (Cloudflare challenge), open it in a new tab —
          completing the check once usually lets it play in the frame afterwards.
          <a
            href={fallbackEmbedUrl(meta)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent/80"
          >
            Open player in new tab <ExternalLink className="size-3" aria-hidden />
          </a>
        </p>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-black px-6 text-center">
        <p className="max-w-sm text-sm text-muted">
          No active streaming mirrors were found for this selection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          key={active.url}
          src={active.url}
          title={`${title} — SuperEmbed ${active.server}`}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          sandbox={MIRROR_SANDBOX}
          className="absolute inset-0 size-full"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">Mirrors</p>
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80"
          >
            Open player in new tab <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
        <div role="tablist" aria-label="SuperEmbed mirrors" className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <button
              key={`${index}-${source.server}`}
              role="tab"
              type="button"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                index === activeIndex
                  ? "border-accent bg-surface text-foreground"
                  : "border-border bg-surface-elevated text-secondary hover:border-white/20 hover:text-foreground",
              )}
              title={source.language ? `Language: ${source.language}` : undefined}
            >
              {source.server}
              {source.quality && <span className="ml-1.5 text-muted">{source.quality}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}