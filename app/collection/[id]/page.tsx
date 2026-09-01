import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/tmdb/client";
import { getTmdbImage } from "@/lib/tmdb/images";
import { MediaGrid } from "@/components/media/media-grid";
import { normalizeMovie } from "@/lib/tmdb/normalize";

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/collection/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const col = await getCollection(Number(id));
    return { title: col.name ?? "Collection", description: col.overview ?? undefined };
  } catch {
    return { title: "Collection" };
  }
}

export default async function CollectionPage({ params }: PageProps<"/collection/[id]">) {
  const { id } = await params;
  const collection = await getCollection(Number(id));
  if (!collection || !collection.id) notFound();

  const backdrop = getTmdbImage(collection.backdrop_path, "backdrop", "w1280");
  const poster = getTmdbImage(collection.poster_path, "poster", "w500");

  return (
    <div>
      <div className="relative w-full overflow-hidden bg-cinema-gradient">
        {backdrop && (
          <div className="absolute inset-0">
            <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover object-center" priority />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--color-background) 0%, rgba(2,11,7,0.5) 45%, rgba(2,11,7,0.7) 100%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-end gap-5 px-5 pb-10 pt-28 md:px-10">
          {poster && (
            <div className="hidden w-40 flex-none overflow-hidden rounded-xl shadow-lg sm:block">
              <Image
                src={poster}
                alt=""
                width={160}
                height={240}
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Collection</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {collection.name}
            </h1>
            {collection.overview && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
                {collection.overview}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
          In this Collection ({collection.parts?.length ?? 0})
        </h2>
        <MediaGrid items={(collection.parts ?? []).map(normalizeMovie)} />
      </div>
    </div>
  );
}
