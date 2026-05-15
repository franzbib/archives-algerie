import { CollectionsBrowser } from "@/components/collections/collections-browser";
import { getArchiveFacets, getCollections } from "@/lib/archiveManifest";

export default function CollectionsPage() {
  const collections = getCollections();
  const facets = getArchiveFacets();

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-foreground">
            Collections d&apos;archives
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/75">
            Parcourez les collections du manifeste local par institution, region,
            periode, statut ou recherche textuelle.
          </p>
        </div>
      </section>

      <CollectionsBrowser collections={collections} facets={facets} />
    </main>
  );
}
