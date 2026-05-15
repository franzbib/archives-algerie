import Link from "next/link";
import { ArrowLeft, Archive, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchSummary,
  getArchiveBatchTypeLabel,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";
import type { ArchiveBatch } from "@/lib/archiveBatches";

export default function LotsPage() {
  const batches = getArchiveBatches();

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Consultation publique
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            Lots d&apos;archives
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page prepare le passage du pilote Boghari vers une gestion
            multi-lots. Un lot regroupe une source, un manifeste d&apos;assets, une
            eventuelle lecture assistee et une route de revue.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 border border-paper-border bg-paper p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div className="space-y-2 text-sm leading-6 text-foreground/80">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Prudence
              </p>
              <p>
                Un lot publie reste non valide tant que les pages, documents,
                OCR et lectures assistees n&apos;ont pas ete verifies humainement.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {batches.map((batch) => (
            <BatchCard batch={batch} key={batch.lotId} />
          ))}
        </div>
      </section>
    </main>
  );
}

function BatchCard({ batch }: { batch: ArchiveBatch }) {
  const summary = getArchiveBatchSummary(batch);
  const isReviewReady = isArchiveBatchReviewReady(batch) && batch.reviewRoute;

  return (
    <article className="border border-paper-border bg-paper p-6">
      <div className="flex items-start justify-between gap-4">
        <Archive className="mt-1 h-5 w-5 shrink-0 text-warm" />
        <StatusBadge variant={isReviewReady ? "warning" : "neutral"}>
          {isReviewReady ? "Pret pour revue" : "A venir"}
        </StatusBadge>
      </div>

      <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {batch.lotId}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
        {batch.title}
      </h2>

      <dl className="mt-5 grid gap-3 text-sm">
        <MetaItem label="LotId" value={batch.lotId} />
        <MetaItem label="Collection" value={batch.collectionId} />
        <MetaItem label="Statut" value={batch.status} />
        <MetaItem label="Source" value={batch.sourceType} />
        <MetaItem label="Type de lot" value={getArchiveBatchTypeLabel(batch)} />
        <MetaItem label="Pages" value={formatCount(getArchiveBatchPageCount(batch))} />
        <MetaItem label="Route de revue" value={batch.reviewRoute ?? "Non renseignee"} />
        <MetaItem
          label="Lectures assistees"
          value={isReviewReady ? String(summary.assistedReadingCount) : "A venir"}
        />
      </dl>

      <p className="mt-5 text-sm leading-6 text-foreground/75">{batch.notes}</p>

      {isReviewReady ? (
        <Link
          className="mt-6 inline-flex w-full items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          href={batch.reviewRoute ?? "#"}
        >
          Ouvrir la revue du lot
        </Link>
      ) : (
        <div className="mt-6 border border-paper-border bg-background px-4 py-3 text-sm text-foreground/70">
          Lot planifie : aucun asset publie n&apos;est encore disponible.
        </div>
      )}
    </article>
  );
}

function formatCount(value: number): string {
  return value > 0 ? String(value) : "Non renseigne";
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}
