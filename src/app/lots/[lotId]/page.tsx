import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, FolderOpen, BookOpen } from "lucide-react";
import { LotReviewBrowser } from "@/components/lots/lot-review-browser";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getArchiveBatchById,
  getArchiveBatches,
  getArchiveBatchPageCount,
  getArchiveBatchReviewItems,
  getArchiveBatchSummary,
  getAssetsForBatch,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";
import { getLanguageDetectionsForLot } from "@/lib/languageDetection";

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
  const languageDetections = getLanguageDetectionsForLot(batch.lotId);
  const summary = getArchiveBatchSummary(batch);
  const isReviewReady = isArchiveBatchReviewReady(batch);
  const pageCount = getArchiveBatchPageCount(batch);

  const firstReviewItem = reviewItems.length > 0 ? reviewItems[0] : null;

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            href="/lots"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="flex flex-col border border-paper-border bg-background p-8 md:p-12 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-paper-border pb-8">
              <div>
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-warm" />
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                    Dossier d&apos;archives — {batch.lotId}
                  </p>
                </div>
                <h1 className="mt-4 font-serif text-4xl font-medium text-foreground md:text-5xl">
                  {batch.title}
                </h1>
              </div>
              <StatusBadge variant={isReviewReady ? "neutral" : "warning"}>
                {isReviewReady ? "Lot publié" : "Lot en préparation"}
              </StatusBadge>
            </div>

            <div className="grid gap-8 pt-8 md:grid-cols-[2fr_1fr]">
              <div>
                <p className="text-base leading-relaxed text-foreground/80 font-serif">
                  {batch.notes}
                </p>
                {firstReviewItem && (
                  <div className="mt-8">
                    <Link
                      href={`/lots/${batch.lotId}/${firstReviewItem.reviewId}`}
                      className="inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                    >
                      <BookOpen className="h-4 w-4" />
                      Commencer la consultation
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-l border-paper-border pl-8">
                <SummaryItem label="Collection" value={batch.collectionId} />
                <SummaryItem label="Pages" value={String(pageCount)} />
                <SummaryItem label="Lectures assistées" value={String(summary.assistedReadingCount)} />
                <SummaryItem label="Validation" value="Non validée" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 border border-paper-border bg-paper/50 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div className="space-y-2 text-sm leading-6 text-foreground/80">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Note de consultation
              </p>
              <p>
                Ce lot contient des images sources brutes. Les éventuelles lectures assistées proposées n&apos;ont pas été validées humainement et peuvent contenir des erreurs. L&apos;image source reste la seule référence valable pour toute citation ou analyse.
              </p>
            </div>
          </div>
        </div>

        {assets.length > 0 ? (
          <div>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-6">
              Planche contact ({pageCount} pages)
            </h2>
            <LotReviewBrowser
              assets={assets}
              languageDetections={languageDetections}
              lotId={batch.lotId}
              reviewItems={reviewItems}
            />
          </div>
        ) : (
          <section className="border border-paper-border bg-paper p-8 text-center">
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Lot en préparation
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-sm leading-6 text-foreground/75">
              Les documents de ce lot ne sont pas encore disponibles à la consultation. Ils apparaîtront ici une fois le processus de publication terminé.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">{label}</p>
      <p className="mt-1 text-base font-medium text-foreground">{value}</p>
    </div>
  );
}
