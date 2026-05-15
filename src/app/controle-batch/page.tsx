import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getBatchReviewItemByAssetFileName,
  getBatchReviewSummary,
  getPublicBatchAssets,
} from "@/lib/batchReview";
import type { PublicBatchAsset } from "@/lib/batchReview";

export default function BatchControlPage() {
  const assets = getPublicBatchAssets();
  const summary = getBatchReviewSummary();

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            href="/inventaire"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au suivi de l&apos;inventaire
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge variant="warning">Lot pilote complet</StatusBadge>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Publication R2
            </p>
          </div>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            Controle du batch Boghari
          </h1>
          <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-foreground/80">
            <p>
              Cette page etend le controle pilote aux 41 images publiees du
              dossier Boghari. Elle rapproche chaque image R2 de sa lecture
              assistee non validee, sans publier les OCR locaux.
            </p>
            <div className="border-l-2 border-warm/40 bg-warm/5 px-4 py-3 text-sm">
              <p>
                Le lot complet reste un support de verification. Les images,
                pages, documents, OCR et lectures assistees ne sont pas valides
                comme sources etablies.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Collection" value={summary.collectionId} />
          <SummaryCard label="Images publiees" value={String(summary.assetCount)} />
          <SummaryCard
            label="Lectures assistees"
            value={String(summary.assistedReadingCount)}
          />
          <SummaryCard label="Validation" value="Non verifiee" />
        </div>

        <section className="mb-8 border border-paper-border bg-paper p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Avertissement methodologique
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
                <p>{summary.warning}</p>
                <p>Les OCR bruts et nettoyes ne sont pas publies dans cette page.</p>
                <p>
                  Les lectures assistees affichees sont des hypotheses de travail,
                  toujours marquees `assisted_unverified`.
                </p>
                <p>
                  Tout usage historique doit revenir a l&apos;image R2 et au
                  fichier Drive d&apos;origine.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-medium text-foreground">
            Images du lot complet
          </h2>
          <Link
            className="text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
            href="/controle-pilote"
          >
            Voir le sample de 8 images
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {assets.map((asset, index) => (
            <BatchAssetCard asset={asset} key={asset.r2ObjectKey} order={index + 1} />
          ))}
        </div>
      </section>
    </main>
  );
}

function BatchAssetCard({ asset, order }: { asset: PublicBatchAsset; order: number }) {
  const reviewItem = getBatchReviewItemByAssetFileName(asset.localJpgFileName);

  return (
    <article className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Image batch {order}
            </p>
            <h2 className="mt-1 break-all font-serif text-xl font-medium text-foreground">
              {asset.localJpgFileName}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {reviewItem?.reviewStatus === "assisted_unverified" ? (
              <StatusBadge variant="warning">Lecture assistee non validee</StatusBadge>
            ) : (
              <StatusBadge variant="neutral">Lecture assistee non disponible</StatusBadge>
            )}
            <StatusBadge variant="warning">Non valide</StatusBadge>
          </div>
        </div>
      </div>

      <div className="bg-background p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Apercu batch ${order} - ${asset.localJpgFileName}`}
          className="max-h-[620px] w-full border border-paper-border bg-paper object-contain"
          loading="lazy"
          src={asset.publicUrl}
        />
      </div>

      <div className="space-y-4 px-5 py-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <MetaItem label="Collection" value={asset.collectionId} />
          <MetaItem label="Publication" value={asset.publicationStatus} />
          <MetaItem label="Validation" value={asset.validationStatus} />
          <MetaItem label="Fichier Drive" value={asset.originalDriveFileId} />
        </dl>

        <p className="text-sm leading-6 text-foreground/75">{asset.note}</p>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
          {reviewItem && (
            <Link
              className="inline-flex flex-1 items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              href={`/controle-batch/${reviewItem.reviewId}`}
            >
              Voir le controle detaille
            </Link>
          )}
          <div className="flex flex-1 flex-wrap items-center gap-4 sm:justify-end">
            <SourceLink href={asset.publicUrl}>Image R2</SourceLink>
            <SourceLink href={asset.originalDriveUrl}>Drive d&apos;origine</SourceLink>
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 break-all font-medium text-foreground">{value}</dd>
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
