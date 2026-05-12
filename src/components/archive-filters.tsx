import { Filter } from "lucide-react";
import {
  getDocumentTypeLabel,
  getStatusLabel,
} from "@/lib/archiveManifest";
import type { ArchiveFacets } from "@/types/archive";

interface ArchiveFiltersProps {
  facets: ArchiveFacets;
}

export function ArchiveFilters({ facets }: ArchiveFiltersProps) {
  return (
    <aside className="border border-paper-border bg-paper p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-paper-border pb-3">
        <Filter className="h-4 w-4 text-warm" />
        <h2 className="font-serif text-lg font-medium">Filtres prevus</h2>
      </div>

      <div className="mt-5 space-y-6">
        <FilterGroup title="Cote" items={facets.references} />
        <FilterGroup title="Lieu / region" items={facets.regions} />
        <FilterGroup title="Periode" items={facets.periods} />
        <FilterGroup
          title="Type"
          items={facets.documentTypes.map((type) => getDocumentTypeLabel(type))}
        />
        <FilterGroup
          title="Statut"
          items={facets.statuses.map((status) => getStatusLabel(status))}
        />
      </div>

      <p className="mt-6 border-t border-dashed border-paper-border pt-4 text-xs leading-5 text-warm">
        Les filtres sont affiches en V0 comme contrat d&apos;interface. Le filtrage
        dynamique sera branche quand les donnees sources seront stabilisees.
      </p>
    </aside>
  );
}

function FilterGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-warm">
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item}
            className="flex cursor-not-allowed items-start gap-2 text-sm text-foreground/80"
          >
            <input
              className="mt-0.5 h-4 w-4 border-paper-border accent-foreground"
              disabled
              type="checkbox"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
