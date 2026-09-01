interface SidebarRow {
  label: string;
  value?: string | null;
}

interface DetailSidebarProps {
  rows: SidebarRow[];
}

export function DetailSidebar({ rows }: DetailSidebarProps) {
  const visible = rows.filter((r) => r.value);
  if (!visible.length) return null;

  return (
    <aside>
      <div className="rounded-2xl border border-white/[0.08] bg-surface p-5">
        <dl className="divide-y divide-white/[0.06]">
          {visible.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="shrink-0 text-sm text-muted">{row.label}</dt>
              <dd className="text-right text-sm text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
