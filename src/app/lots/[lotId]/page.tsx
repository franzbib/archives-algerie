import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { LotReviewBrowser } from "@/components/lots/lot-review-browser";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getArchiveBatchById,
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchReviewItems,
  getArchiveBatchSummary,
  getArchiveBatchTypeLabel,
  getAssetsForBatch,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArchiveBatches().map((batch) => ({ lotId: batch.lotId }));
}

export default async function LotReviewPage({
  params,
}: {
  params: Promise<{ lotId: string }>;
}) {
  const { lotId } = await params;
  const batch = getArchiveBatchById(lotId);

  if (!batch) {
    notFound();
  }

  const assets = getAssetsForBatch(batch);
  const reviewItems = getArchiveBatchReviewItems(batch);
  const summary = getArchiveBatchSummary(batch);
  const isReviewReady = isArchiveBatchReviewReady(batch);
  const pageCount = getArchiveBatchPageCount(batch);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            href="/lots"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux lots
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge variant={isReviewReady ? "warning" : "neutral"}>
              {isReviewReady ? "Lot pret pour revue" : "Lot planifie"}
            </StatusBadge>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              {batch.lotId}
            </p>
          </div>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            {batch.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            {batch.notes}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Collection" value={batch.collectionId} />
          <SummaryCard label="Pages" value={String(pageCount)} />
          <SummaryCard label="Type de lot" value={getArchiveBatchTypeLabel(batch)} />
          <SummaryCard
            label="Lectures assistees"
            value={String(summary.assistedReadingCount)}
          />
          <SummaryCard label="Validation" value="Non validee" />
        </div>

        <section className="mb-8 border border-paper-border bg-paper p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div className="space-y-2 text-sm leading-6 text-foreground/80">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Avertissement methodologique
              </p>
              <p>
                Cette revue generique ne valide pas les pages, documents, OCR ou
                lectures assistees. Les sources doivent etre controlees sur image.
              </p>
            </div>
          </div>
        </section>

        {assets.length > 0 ? (
          <LotReviewBrowser
            assets={assets}
            lotId={batch.lotId}
            reviewItems={reviewItems}
          />
        ) : (
          <section className="border border-paper-border bg-paper p-8">
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Lot a venir
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75">
              Aucun manifeste public d&apos;images n&apos;est encore associe a ce lot.
              Il devra d&apos;abord passer par un inventaire controle, puis par une
              publication explicite.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-paper-border bg-paper p-4">
      <p className="font-mono text-xs uppercase tracking-wide text-warm">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
