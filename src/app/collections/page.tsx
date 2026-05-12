import { ArchiveFilters } from "@/components/archive-filters";
import { CollectionList } from "@/components/collection-list";
import { getArchiveFacets, getCollections } from "@/lib/archiveManifest";

export default function CollectionsPage() {
  const collections = getCollections();
  const facets = getArchiveFacets();

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-paper-border bg-paper/70">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-warm">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-foreground">
            Collections d&apos;archives
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/75">
            Liste issue du manifeste local. Les filtres par cote, lieu, periode,
            type de document et statut sont prevus pour la suite.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr] lg:px-8">
        <ArchiveFilters facets={facets} />
        <CollectionList collections={collections} />
      </section>
    </main>
  );
}
