import type { Genre, MediaItem } from "@/lib/api/types";
import { MediaGrid } from "./media-grid";
import { CatalogFilterSelect } from "./catalog-filter-select";
import { ErrorState } from "./error-state";
import { Pagination } from "./pagination";

export interface CatalogOption {
  key: string;
  label: string;
}

export interface CatalogFilters {
  genres: Genre[];
  years: number[];
  activeGenre?: number;
  activeYear?: number;
}

async function CatalogBody({
  loader,
  basePath,
  activeKey,
  firstOptionKey,
  page,
  activeGenre,
  activeYear,
}: {
  loader: () => Promise<{ items: MediaItem[]; totalPages: number }>;
  basePath: string;
  activeKey: string;
  firstOptionKey: string;
  page: number;
  activeGenre?: number;
  activeYear?: number;
}) {
  let result: { items: MediaItem[]; totalPages: number };
  try {
    result = await loader();
  } catch {
    return <ErrorState />;
  }

  if (!result.items.length) {
    return (
      <p className="rounded-card border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted">
        No titles found for this selection.
      </p>
    );
  }

  return (
    <>
      <MediaGrid items={result.items} />
      <Pagination
        page={page}
        totalPages={result.totalPages}
        basePath={basePath}
        searchParams={{
          sort: activeKey === firstOptionKey ? undefined : activeKey,
          genre: activeGenre ? String(activeGenre) : undefined,
          year: activeYear ? String(activeYear) : undefined,
        }}
      />
    </>
  );
}

/**
 * Shared catalog layout used by /movies and /tv: sort tabs plus a paginated grid.
 */
export function CatalogView({
  title,
  tagline,
  basePath,
  options,
  activeKey,
  page,
  loader,
  filters,
}: {
  title: string;
  tagline?: string;
  basePath: string;
  options: CatalogOption[];
  activeKey: string;
  page: number;
  loader: () => Promise<{ items: MediaItem[]; totalPages: number }>;
  filters?: CatalogFilters;
}) {
  return (
    <>
      <header>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {tagline && <p className="mt-2 max-w-xl text-sm text-muted">{tagline}</p>}
        </div>
      </header>

      {filters && (filters.genres.length > 0 || filters.years.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <CatalogFilterSelect
            label="Sort"
            basePath={basePath}
            paramName="sort"
            value={activeKey === options[0].key ? "" : activeKey}
            options={[
              { value: "", label: options[0].label },
              ...options.slice(1).map((o) => ({ value: o.key, label: o.label })),
            ]}
            extraParams={{
              genre: filters.activeGenre ? String(filters.activeGenre) : undefined,
              year: filters.activeYear ? String(filters.activeYear) : undefined,
            }}
          />
          {filters.genres.length > 0 && (
            <CatalogFilterSelect
              label="Genre"
              basePath={basePath}
              paramName="genre"
              value={filters.activeGenre ? String(filters.activeGenre) : ""}
              options={[
                { value: "", label: "All Genres" },
                ...filters.genres.map((g) => ({ value: String(g.id), label: g.name })),
              ]}
              extraParams={{
                sort: activeKey === options[0].key ? undefined : activeKey,
                year: filters.activeYear ? String(filters.activeYear) : undefined,
              }}
            />
          )}
          {filters.years.length > 0 && (
            <CatalogFilterSelect
              label="Year"
              basePath={basePath}
              paramName="year"
              value={filters.activeYear ? String(filters.activeYear) : ""}
              options={[
                { value: "", label: "All Years" },
                ...filters.years.map((y) => ({ value: String(y), label: String(y) })),
              ]}
              extraParams={{
                sort: activeKey === options[0].key ? undefined : activeKey,
                genre: filters.activeGenre ? String(filters.activeGenre) : undefined,
              }}
            />
          )}
        </div>
      )}

      <div className="mt-8">
        <CatalogBody
          loader={loader}
          basePath={basePath}
          activeKey={activeKey}
          firstOptionKey={options[0].key}
          page={page}
          activeGenre={filters?.activeGenre}
          activeYear={filters?.activeYear}
        />
      </div>
    </>
  );
}
