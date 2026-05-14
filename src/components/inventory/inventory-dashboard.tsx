"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getReliabilityLevelLabel,
  getStatusLabel,
  hasV1Enrichment,
} from "@/lib/archiveManifest";
import type { ArchiveStatus, Collection } from "@/types/archive";

interface InventoryDashboardProps {
  collections: Collection[];
}

interface InventoryFilters {
  institution: string;
  query: string;
  status: string;
  v1Enrichment: string;
}

const emptyFilters: InventoryFilters = {
  institution: "",
  query: "",
  status: "",
  v1Enrichment: "",
};

const statusOrder: ArchiveStatus[] = [
  "to_inventory",
  "inventoried",
  "ocr_pending",
  "ocr_done",
  "indexed",
  "verified",
];

export function InventoryDashboard({ collections }: InventoryDashboardProps) {
  const [filters, setFilters] = useState<InventoryFilters>(emptyFilters);

  const institutions = useMemo(
    () => unique(collections.map((collection) => collection.sourceInstitution)),
    [collections],
  );
  const statuses = useMemo(
    () => statusOrder.filter((status) => collections.some((item) => item.status === status)),
    [collections],
  );

  const filteredCollections = useMemo(
    () => filterCollections(collections, filters),
    [collections, filters],
  );

  const statusCounts = useMemo(
    () => countBy(collections, (collection) => getStatusLabel(collection.status)),
    [collections],
  );
  const institutionCounts = useMemo(
    () => countBy(collections, (collection) => collection.sourceInstitution),
    [collections],
  );
  const regionCounts = useMemo(
    () => countBy(collections, (collection) => collection.region || "Non renseigné"),
    [collections],
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  function updateFilter(name: keyof InventoryFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <DistributionCard title="Statuts de traitement" items={statusCounts} />
        <DistributionCard title="Institutions source" items={institutionCounts} />
        <DistributionCard title="Régions" items={regionCounts} />
      </section>

      <section className="border border-paper-border bg-paper p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-warm"
              htmlFor="inventory-search"
            >
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm" />
              <input
                className="w-full border border-paper-border bg-background px-3 py-2 pl-9 text-sm text-foreground"
                id="inventory-search"
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Titre, cote, région, période..."
                type="search"
                value={filters.query}
              />
            </div>
          </div>

          <SelectFilter
            label="Statut"
            name="inventory-status"
            onChange={(value) => updateFilter("status", value)}
            options={statuses.map((status) => ({
              label: getStatusLabel(status),
              value: status,
            }))}
            value={filters.status}
          />
          <SelectFilter
            label="Institution"
            name="inventory-institution"
            onChange={(value) => updateFilter("institution", value)}
            options={institutions}
            value={filters.institution}
          />
          <SelectFilter
            label="Notice V1"
            name="inventory-v1"
            onChange={(value) => updateFilter("v1Enrichment", value)}
            options={[
              { label: "Toutes", value: "" },
              { label: "Enrichies", value: "enriched" },
              { label: "Non enrichies", value: "not_enriched" },
            ]}
            value={filters.v1Enrichment}
            includeAllOption={false}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-paper-border pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-warm">
            {filteredCollections.length} collection
            {filteredCollections.length > 1 ? "s" : ""}
          </p>
          <button
            className="border border-paper-border bg-background px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(emptyFilters)}
            type="button"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      <section className="grid gap-3">
        {filteredCollections.length > 0 ? (
          filteredCollections.map((collection) => (
            <InventoryRow collection={collection} key={collection.id} />
          ))
        ) : (
          <div className="border-2 border-dashed border-paper-border bg-paper/30 p-8 text-center text-sm leading-6 text-warm">
            Aucune collection ne correspond à ces critères.
          </div>
        )}
      </section>
    </div>
  );
}

function InventoryRow({ collection }: { collection: Collection }) {
  const enriched = hasV1Enrichment(collection);

  return (
    <article className="border border-paper-border bg-paper p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            {collection.archiveReference}
          </p>
          <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
            <Link
              className="underline-offset-4 hover:underline"
              href={`/collections/${collection.id}`}
            >
              {collection.title}
            </Link>
          </h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Institution" value={collection.sourceInstitution} />
            <MetaItem label="Région" value={collection.region} />
            <MetaItem label="Période" value={collection.period} />
            <MetaItem label="Documents" value={String(collection.documentCount)} />
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-52 lg:justify-end">
          <StatusBadge variant="neutral">{getStatusLabel(collection.status)}</StatusBadge>
          {enriched && <StatusBadge variant="neutral">Notice V1</StatusBadge>}
          {collection.reliabilityLevel && (
            <StatusBadge variant="neutral">
              {getReliabilityLevelLabel(collection.reliabilityLevel)}
            </StatusBadge>
          )}
        </div>
      </div>
    </article>
  );
}

function DistributionCard({
  items,
  title,
}: {
  items: Array<{ label: string; value: number }>;
  title: string;
}) {
  return (
    <div className="border border-paper-border bg-paper p-5">
      <h3 className="font-serif text-xl font-medium text-foreground">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4 text-sm" key={item.label}>
            <span className="text-foreground/75">{item.label}</span>
            <span className="font-mono text-xs font-semibold text-warm">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectFilter({
  includeAllOption = true,
  label,
  name,
  onChange,
  options,
  value,
}: {
  includeAllOption?: boolean;
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
        {includeAllOption && <option value="">Tous</option>}
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function filterCollections(
  collections: Collection[],
  filters: InventoryFilters,
): Collection[] {
  const query = normalizeText(filters.query);

  return collections.filter((collection) => {
    const searchableText = normalizeText(
      [
        collection.title,
        collection.archiveReference,
        collection.sourceInstitution,
        collection.region,
        collection.period,
        collection.status,
      ].join(" "),
    );

    return (
      matches(collection.status, filters.status) &&
      matches(collection.sourceInstitution, filters.institution) &&
      matchesV1Enrichment(collection, filters.v1Enrichment) &&
      (!query || searchableText.includes(query))
    );
  });
}

function matches(value: string, filter: string): boolean {
  return !filter || value === filter;
}

function matchesV1Enrichment(collection: Collection, filter: string): boolean {
  if (!filter) {
    return true;
  }

  const enriched = hasV1Enrichment(collection);

  if (filter === "enriched") {
    return enriched;
  }

  if (filter === "not_enriched") {
    return !enriched;
  }

  return true;
}

function countBy(
  collections: Collection[],
  getKey: (collection: Collection) => string,
): Array<{ label: string; value: number }> {
  const counts = collections.reduce<Record<string, number>>((accumulator, collection) => {
    const key = getKey(collection);
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}
