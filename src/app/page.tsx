import Link from "next/link";

import {
  Archive,
  ArrowRight,
  ClipboardList,
  Layers3,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchSummary,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";

export default function Home() {
  const batches = getArchiveBatches();
  const reviewReadyBatches = batches.filter(isArchiveBatchReviewReady);
  const consultablePageCount = reviewReadyBatches.reduce(
    (total, batch) => total + getArchiveBatchPageCount(batch),
    0,
  );
  const assistedReadingCount = reviewReadyBatches.reduce(
    (total, batch) => total + getArchiveBatchSummary(batch).assistedReadingCount,
    0,
  );
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="max-w-4xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Archives historiques scannees sur l&apos;Algerie
            </p>
            <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground">
              Explorer les lots d&apos;archives publies sans perdre le contexte
              archivistique.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/80">
              Les lots consultables regroupent les images publiees, leurs
              lectures assistees non validees et les liens vers les sources. La
              couche collections V0 reste disponible comme manifeste
              archivistique, mais la consultation principale passe maintenant par
              les lots.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Lots en revue" value={reviewReadyBatches.length} />
            <StatCard label="Pages consultables" value={consultablePageCount} />
            <StatCard label="Lectures assistees" value={assistedReadingCount} />
            <StatCard label="Lots suivis" value={batches.length} />
          </div>

          <div className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Lots d&apos;archives publies
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {reviewReadyBatches.map((batch) => (
                <Link
                  key={batch.lotId}
                  href={`/lots/${batch.lotId}`}
                  className="group border border-paper-border bg-background p-5 transition-colors hover:border-warm/50"
                >
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                    {batch.lotId}
                  </p>
                  <h3 className="mt-2 font-serif text-xl font-medium text-foreground group-hover:text-warm">
                    {batch.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-foreground/70">
                      {getArchiveBatchPageCount(batch)} pages
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-warm">
                      Consulter ce lot <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/lots"
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                <Layers3 className="h-4 w-4" />
                Tous les lots
              </Link>
              <Link
                href="/inventaire"
                className="inline-flex items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                <ClipboardList className="h-4 w-4" />
                Suivi technique
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-paper-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row lg:px-8">
          <p className="text-sm text-foreground/70">
            Reperes V0 conserves pour la tracabilite.
          </p>
          <Link
            href="/collections"
            className="inline-flex shrink-0 items-center gap-2 border border-paper-border bg-paper px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-paper-border/50"
          >
            <Archive className="h-3.5 w-3.5" />
            Voir le manifeste V0
          </Link>
        </div>
      </section>
    </main>
  );
}
