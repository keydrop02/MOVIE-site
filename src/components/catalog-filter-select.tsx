"use client";

import { useRouter } from "next/navigation";
import { Dropdown } from "./dropdown";

/** Catalog filter dropdown that pushes a new query string on change. */
export function CatalogFilterSelect({
  label,
  basePath,
  paramName,
  value,
  options,
  extraParams,
}: {
  label: string;
  basePath: string;
  paramName: string;
  value: string;
  options: { value: string; label: string }[];
  extraParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();

  return (
    <Dropdown
      ariaLabel={`Filter by ${label.toLowerCase()}`}
      value={value}
      options={options}
      onChange={(next) => {
        const params = new URLSearchParams();
        for (const [key, val] of Object.entries(extraParams ?? {})) {
          if (val) params.set(key, val);
        }
        if (next) params.set(paramName, next);
        params.set("page", "1");
        const qs = params.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath);
      }}
      className="h-9 rounded-full border border-border-strong bg-card px-4 pr-3 text-sm font-medium text-foreground"
    />
  );
}
