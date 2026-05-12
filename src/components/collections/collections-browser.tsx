"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { CollectionList } from "@/components/collection-list";
import { getStatusLabel } from "@/lib/archiveManifest";
import type { ArchiveFacets, ArchiveStatus, Collection } from "@/types/archive";

interface CollectionsBrowserProps {
  collections: Collection[];
  facets: ArchiveFacets;
}

interface ClientFilters {
  period: string;
  query: string;
  region: string;
  sourceInstitution: string;
  status: string;
}

const emptyFilters: ClientFilters = {
  period: "",
  query: "",
  region: "",
  sourceInstitution: "",
  status: "",
};

export function CollectionsBrowser({ collections, facets }: CollectionsBrowserProps) {
  const sourceInstitutions = useMemo(
    () =>
      [...new Set(collections.map((collection) => collection.sourceInstitution))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [collections],
  );
  const [filters, setFilters] = useState<ClientFilters>(emptyFilters);

  const filteredCollections = useMemo(
    () => filterCollections(collections, filters),
    [collections, filters],
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  function updateFilter(name: keyof ClientFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[300px_1fr] lg:px-8">
      <aside className="border border-paper-border bg-paper p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-paper-border pb-3">
          <Filter className="h-4 w-4 text-warm" />
          <h2 className="font-serif text-lg font-medium">Filtres</h2>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-warm"
              htmlFor="collection-search"
            >
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm" />
              <input
                className="w-full border border-paper-border bg-background px-3 py-2 pl-9 text-sm text-foreground"
                id="collection-search"
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Titre, cote, description..."
                type="search"
                value={filters.query}
              />
            </div>
          </div>

          <SelectFilter
            label="Institution source"
            name="sourceInstitution"
            onChange={(value) => updateFilter("sourceInstitution", value)}
            options={sourceInstitutions}
            value={filters.sourceInstitution}
          />
          <SelectFilter
            label="Region"
            name="region"
            onChange={(value) => updateFilter("region", value)}
            options={facets.regions}
            value={filters.region}
          />
          <SelectFilter
            label="Periode"
            name="period"
            onChange={(value) => updateFilter("period", value)}
            options={facets.periods}
            value={filters.period}
          />
          <SelectFilter
            label="Statut"
            name="status"
            onChange={(value) => updateFilter("status", value)}
            options={facets.statuses.map((status) => ({
              label: getStatusLabel(status),
              value: status,
            }))}
            value={filters.status}
          />

          <button
            className="w-full border border-paper-border bg-background px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(emptyFilters)}
            type="button"
          >
            Reinitialiser les filtres
          </button>
        </div>
      </aside>

      <div>
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-warm">
          {filteredCollections.length} collection
          {filteredCollections.length > 1 ? "s" : ""}
        </p>
        <CollectionList collections={filteredCollections} />
      </div>
    </section>
  );
}

function SelectFilter({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: Array<string | { label: string; value: string }>;
  value: string;
}) {
  return (
    <div>
      <label
        className="mb-2 block font-mono text-xs uppercase tracking-widest text-warm"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        className="w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground"
        id={name}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Tous</option>
        {options.map((option) => {
          const normalized =
            typeof option === "string" ? { label: option, value: option } : option;

          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function filterCollections(
  collections: Collection[],
  filters: ClientFilters,
): Collection[] {
  const query = normalizeText(filters.query);

  return collections.filter((collection) => {
    const searchableText = normalizeText(
      [
        collection.title,
        collection.archiveReference,
        collection.description,
      ].join(" "),
    );

    return (
      matches(collection.sourceInstitution, filters.sourceInstitution) &&
      matches(collection.region, filters.region) &&
      matches(collection.period, filters.period) &&
      matches(collection.status, filters.status as ArchiveStatus | "") &&
      (!query || searchableText.includes(query))
    );
  });
}

function matches(value: string, filter: string): boolean {
  return !filter || value === filter;
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}
