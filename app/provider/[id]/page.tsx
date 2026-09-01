import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { discoverMovies, discoverTV, getProviders } from "@/lib/tmdb/client";
import { ProviderBrowser } from "@/components/media/provider-browser";
import type { Media } from "@/lib/tmdb/types";

export const revalidate = 1800;

type ProviderType = "all" | "movie" | "tv";

async function providerFetch(
  providerId: number,
  type: ProviderType,
  page: number
): Promise<{ items: Media[]; totalResults: number; totalPages: number }> {
  const params: Parameters<typeof discoverMovies>[0] = {
    providers: [providerId],
    sortBy: "popularity.desc",
    page,
  };

  if (type === "movie") {
    const d = await discoverMovies(params);
    return { items: d.results, totalResults: d.totalResults, totalPages: d.totalPages };
  }
  if (type === "tv") {
    const d = await discoverTV(params);
    return { items: d.results, totalResults: d.totalResults, totalPages: d.totalPages };
  }

  const [movies, tv] = await Promise.all([discoverMovies(params), discoverTV(params)]);
  const totalResults = movies.totalResults + tv.totalResults;
  const totalPages = Math.max(movies.totalPages, tv.totalPages, 1);

  const seen = new Set<string>();
  const items: Media[] = [];
  const max = Math.max(movies.results.length, tv.results.length);
  for (let i = 0; i < max; i++) {
    for (const arr of [movies.results, tv.results]) {
      const item = arr[i];
      if (!item) continue;
      const key = `${item.type}-${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
  }
  return { items, totalResults, totalPages };
}

export async function generateMetadata({ params }: PageProps<"/provider/[id]">): Promise<Metadata> {
  const { id } = await params;
  const providers = await getProviders("US").catch(() => []);
  const p = providers.find((x) => x.provider_id === Number(id));
  return { title: p ? `${p.provider_name} — Movies & Shows` : "Provider" };
}

export default async function ProviderPage({ params, searchParams }: PageProps<"/provider/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const providerId = Number(id);
  const rawType = sp.type;
  const type: ProviderType = rawType === "movie" || rawType === "tv" ? rawType : "all";

  const provider = (await getProviders("US").catch(() => [])).find(
    (x) => x.provider_id === providerId
  );
  if (!provider) notFound();

  const initial = await providerFetch(providerId, type, 1);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-20 md:px-10 md:pt-24">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {provider.provider_name}
        </h1>
      </header>

      <ProviderBrowser
        key={type}
        providerId={providerId}
        initialType={type}
        initialItems={initial.items}
        totalResults={initial.totalResults}
        totalPages={initial.totalPages}
      />
    </div>
  );
}
