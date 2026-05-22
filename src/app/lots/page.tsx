import Link from "next/link";
import { ArrowLeft, Archive, FolderOpen } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchSummary,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";
import type { ArchiveBatch } from "@/lib/archiveBatches";

export default function LotsPage() {
  const batches = getArchiveBatches();
  const readyBatches = batches.filter((b) => isArchiveBatchReviewReady(b) && b.reviewRoute);
  const plannedBatches = batches.filter((b) => !(isArchiveBatchReviewReady(b) && b.reviewRoute));

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Catalogue du corpus
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            Lots d&apos;archives
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80 font-serif">
            Les documents sont regroupés par lots de numérisation. Chaque lot contient des pages sources accompagnées, lorsqu&apos;elles sont disponibles, de lectures assistées destinées à faciliter la recherche.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-12">
          <h2 className="mb-8 flex items-center gap-3 font-serif text-2xl font-medium text-foreground">
            <span className="flex h-3 w-3 rounded-full bg-warm"></span>
            Lots consultables
          </h2>
          {readyBatches.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {readyBatches.map((batch) => (
                <BatchCard batch={batch} key={batch.lotId} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/70 italic">Aucun lot actuellement consultable.</p>
          )}
        </div>

        <div>
          <h2 className="mb-8 flex items-center gap-3 font-serif text-2xl font-medium text-foreground">
            <span className="flex h-3 w-3 rounded-full border-2 border-paper-border bg-paper"></span>
            Lots en préparation
          </h2>
          {plannedBatches.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3 opacity-75">
              {plannedBatches.map((batch) => (
                <BatchCard batch={batch} key={batch.lotId} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/70 italic">Aucun lot en préparation.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function BatchCard({ batch }: { batch: ArchiveBatch }) {
  const summary = getArchiveBatchSummary(batch);
  const isReviewReady = isArchiveBatchReviewReady(batch) && batch.reviewRoute;
  const pageCount = getArchiveBatchPageCount(batch);

  return (
    <article className="flex flex-col border border-paper-border bg-paper transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-paper-border bg-background/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-warm" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-warm">
            {batch.lotId}
          </p>
        </div>
        <StatusBadge variant={isReviewReady ? "neutral" : "warning"}>
          {isReviewReady ? "Publié" : "À venir"}
        </StatusBadge>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-serif text-2xl font-medium text-foreground line-clamp-2">
          {batch.title}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-foreground/75 line-clamp-3">
          {batch.notes}
        </p>

        <div className="mt-6 mb-8 grid grid-cols-2 gap-4">
          <div className="border-l-2 border-warm/20 pl-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">Pages</p>
            <p className="mt-1 font-medium text-foreground">{pageCount > 0 ? pageCount : "—"}</p>
          </div>
          <div className="border-l-2 border-warm/20 pl-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">Lectures</p>
            <p className="mt-1 font-medium text-foreground">
              {isReviewReady ? summary.assistedReadingCount : "—"}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          {isReviewReady ? (
            <Link
              className="group flex w-full items-center justify-center gap-2 border border-foreground bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={`/lots/${batch.lotId}`}
            >
              <FolderOpen className="h-4 w-4 group-hover:text-background" />
              Ouvrir le lot
            </Link>
          ) : (
            <div className="flex w-full items-center justify-center border border-paper-border bg-background/50 px-4 py-2.5 text-sm text-foreground/50">
              Pages en cours de traitement
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
