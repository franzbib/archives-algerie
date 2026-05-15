import Link from "next/link";
import { CollectionsBrowser } from "@/components/collections/collections-browser";
import { getArchiveFacets, getCollections } from "@/lib/archiveManifest";

export default function CollectionsPage() {
  const collections = getCollections();
  const facets = getArchiveFacets();

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <div className="mb-8 border border-foreground bg-background p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Avertissement
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Cette page conserve les repères du manifeste local V0.
                </p>
              </div>
              <Link
                href="/lots"
                className="inline-flex shrink-0 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Consulter les archives dans /lots
              </Link>
            </div>
          </div>

          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Traçabilité
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-foreground">
            Manifeste V0 - repères conservés
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/75">
            Parcourez les filtres du manifeste local V0 par institution, region,
            periode ou statut. Pour la consultation réelle, rendez-vous dans les lots.
          </p>
        </div>
      </section>

      <CollectionsBrowser collections={collections} facets={facets} />
    </main>
  );
}
