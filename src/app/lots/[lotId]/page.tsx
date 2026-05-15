import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getArchiveBatchById,
  getArchiveBatches,
  getArchiveBatchReviewItemById,
  getArchiveBatchSummary,
  getAssetsForBatch,
} from "@/lib/archiveBatches";
import type { ArchiveBatchAsset } from "@/lib/archiveBatches";

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
  const summary = getArchiveBatchSummary(batch);
  const isPublished = batch.status === "published_unvalidated";

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
            <StatusBadge variant={isPublished ? "warning" : "neutral"}>
              {isPublished ? "Lot publie non valide" : "Lot planifie"}
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
          <SummaryCard label="Items" value={String(batch.itemCount ?? assets.length)} />
          <SummaryCard
            label="Lectures assistees"
            value={String(summary.assistedReadingCount)}
          />
          <SummaryCard label="Validation" value="Non verifiee" />
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
          <div className="grid gap-6 lg:grid-cols-2">
            {assets.map((asset, index) => (
              <LotAssetCard
                asset={asset}
                key={asset.r2ObjectKey}
                lotId={batch.lotId}
                order={index + 1}
              />
            ))}
          </div>
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

function LotAssetCard({
  asset,
  lotId,
  order,
}: {
  asset: ArchiveBatchAsset;
  lotId: string;
  order: number;
}) {
  const batch = getArchiveBatchById(lotId);
  const reviewItem = batch
    ? getArchiveBatchReviewItemById(batch, asset.reviewId)
    : undefined;

  return (
    <article className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Item {order}
            </p>
            <h2 className="mt-1 break-all font-serif text-xl font-medium text-foreground">
              {asset.localJpgFileName}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatusBadge variant="warning">Non valide</StatusBadge>
            {reviewItem?.reviewStatus === "assisted_unverified" && (
              <StatusBadge variant="warning">Lecture assistee</StatusBadge>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Image du lot ${lotId} - ${asset.localJpgFileName}`}
          className="max-h-[620px] w-full border border-paper-border bg-paper object-contain"
          loading="lazy"
          src={asset.publicUrl}
        />
      </div>

      <div className="space-y-4 px-5 py-5">
        <p className="text-sm leading-6 text-foreground/75">{asset.note}</p>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
          <Link
            className="inline-flex flex-1 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            href={`/lots/${lotId}/${asset.reviewId}`}
          >
            Voir le controle detaille
          </Link>
          <div className="flex flex-1 flex-wrap items-center gap-4 sm:justify-end">
            <SourceLink href={asset.publicUrl}>Image R2</SourceLink>
            <SourceLink href={asset.originalDriveUrl}>Drive</SourceLink>
          </div>
        </div>
      </div>
    </article>
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

function SourceLink({ children, href }: { children: string; href: string }) {
  return (
    <a
      className="inline-flex items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
