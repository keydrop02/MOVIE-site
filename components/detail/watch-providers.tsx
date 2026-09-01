import Image from "next/image";
import { getTmdbImage } from "@/lib/tmdb/images";
import type { WatchProvider } from "@/lib/tmdb/types";

interface WatchProvidersProps {
  results: Record<string, { flatrate?: WatchProvider[]; rent?: WatchProvider[]; buy?: WatchProvider[] }>;
  country?: string;
  className?: string;
}

function ProviderRow({ label, list }: { label: string; list: WatchProvider[] }) {
  if (!list.length) return null;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-12 shrink-0 text-xs text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {list.slice(0, 8).map((p) => {
          const logo = getTmdbImage(p.logo_path, "logo", "w92");
          return (
            <span
              key={p.provider_id}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-black ring-1 ring-white/10"
              title={p.provider_name}
            >
              {logo ? (
                <Image
                  src={logo}
                  alt={p.provider_name}
                  width={40}
                  height={40}
                  className="object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="px-1 text-center text-[8px] leading-tight text-muted">
                  {p.provider_name}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function WatchProviders({ results, country = "US", className }: WatchProvidersProps) {
  const entry = results?.[country];
  const rent = entry?.rent ?? [];

  if (!rent.length) return null;

  return (
    <div className={`space-y-2.5 ${className ?? ""}`}>
      <ProviderRow label="Rent" list={rent} />
    </div>
  );
}
