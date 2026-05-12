import {
  ArchiveManifestList,
  StatusLegend,
} from "@/components/archive-manifest-list";
import { ArchiveTree } from "@/components/archive-tree";
import { StatCard } from "@/components/stat-card";
import { archiveCollections, getArchiveStats } from "@/lib/archive-data";
import {
  getArchiveManifestSummary,
  getManifestCollections,
} from "@/lib/archiveManifest";

export default function Home() {
  const stats = getArchiveStats(archiveCollections);
  const manifestCollections = getManifestCollections();
  const manifestSummary = getArchiveManifestSummary();

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
              Archives Algerie - V0
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-stone-950 md:text-5xl">
              Inventaire archivistique pour collections, cotes, dossiers et documents.
            </h1>
            <p className="mt-5 text-base leading-7 text-stone-600">
              Cette premiere version pose une structure de consultation sobre:
              une page d&apos;accueil, une arborescence d&apos;archives et un manifeste
              stable pour preparer l&apos;OCR, l&apos;indexation et la recherche.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Manifeste" value={manifestSummary.collections} />
            <StatCard label="Dossiers" value={stats.folders} />
            <StatCard label="Documents" value={stats.documents} />
            <StatCard label="Pages" value={stats.pages} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
              Couche intermediaire
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
              Manifeste des collections
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Le manifeste reference les collections et leurs dossiers Drive
              sans appeler l&apos;API Google Drive. Il sert de contrat stable
              pour l&apos;inventaire, l&apos;OCR, l&apos;indexation et la recherche.
            </p>
          </div>
          <StatusLegend />
        </div>

        <ArchiveManifestList collections={manifestCollections} />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
              Instrument de recherche
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
              Arborescence des fonds
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-600">
            Les images numerisees ne sont qu&apos;un support de page: elles restent
            rattachees a des documents, eux-memes classes dans des dossiers et
            collections avec leurs cotes.
          </p>
        </div>

        <ArchiveTree collections={archiveCollections} />
      </section>
    </main>
  );
}
