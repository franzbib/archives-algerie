import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { DocumentAnnotations } from "@/components/document-annotations";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getArchiveBatchAssetForReview,
  getArchiveBatchById,
  getArchiveBatches,
  getArchiveBatchReviewItemById,
  getArchiveBatchReviewItems,
  getAssistedReadingForArchiveBatchReview,
} from "@/lib/archiveBatches";
import type {
  ArchiveBatchReviewItem,
  AssistedReadingExample,
  AssistedReadingUncertainty,
} from "@/lib/archiveBatches";
import {
  getHumanReviewNote,
  type HumanReviewNote,
} from "@/lib/humanReviews";
import {
  getLanguageDetectionForPage,
  getLanguageLabel,
  getScriptLabel,
} from "@/lib/languageDetection";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArchiveBatches().flatMap((batch) =>
    getArchiveBatchReviewItems(batch).map((item) => ({
      lotId: batch.lotId,
      reviewId: item.reviewId,
    })),
  );
}

export default async function GenericLotReviewPage({
  params,
}: {
  params: Promise<{ lotId: string; reviewId: string }>;
}) {
  const { lotId, reviewId } = await params;
  const batch = getArchiveBatchById(lotId);

  if (!batch) {
    notFound();
  }

  const reviewItem = getArchiveBatchReviewItemById(batch, reviewId);

  if (!reviewItem) {
    notFound();
  }

  const asset = getArchiveBatchAssetForReview(batch, reviewItem);

  if (!asset) {
    notFound();
  }

  const assistedReading = getAssistedReadingForArchiveBatchReview(batch, reviewItem);
  const languageDetection = getLanguageDetectionForPage(batch.lotId, reviewItem.reviewId);
  const humanReviewNote = getHumanReviewNote(batch.lotId, reviewItem.reviewId);
  const humanReviewTemplate = getHumanReviewTemplate(batch.lotId, reviewItem.reviewId);
  const reviewItems = getArchiveBatchReviewItems(batch);
  const currentIndex = reviewItems.findIndex((item) => item.reviewId === reviewId);
  const positionLabel = `Page ${currentIndex + 1} sur ${reviewItems.length}`;
  const prevItem = currentIndex > 0 ? reviewItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex < reviewItems.length - 1 ? reviewItems[currentIndex + 1] : null;

  return (
    <main className="min-h-screen bg-background pb-16">
      {/* NAVIGATION BAR */}
      <div className="sticky top-[73px] z-10 border-b border-paper-border bg-paper/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-3">
          <Link
            href={`/lots/${batch.lotId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-warm hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au lot {batch.lotId}
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium">
            {prevItem ? (
              <Link
                href={`/lots/${batch.lotId}/${prevItem.reviewId}`}
                className="inline-flex items-center gap-1 text-foreground hover:text-warm transition-colors"
                title="Page précédente"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Précédent</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-foreground/30 cursor-not-allowed">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Précédent</span>
              </span>
            )}

            <span className="font-mono text-xs uppercase tracking-widest text-foreground/60 bg-background border border-paper-border px-3 py-1">
              {positionLabel}
            </span>

            {nextItem ? (
              <Link
                href={`/lots/${batch.lotId}/${nextItem.reviewId}`}
                className="inline-flex items-center gap-1 text-foreground hover:text-warm transition-colors"
                title="Page suivante"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-foreground/30 cursor-not-allowed">
                <span className="hidden sm:inline">Suivant</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 pt-8 pb-4">
         <div className="border border-paper-border bg-paper/50 p-4 mb-8 flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-warm" />
            <p>
              <strong>L&apos;image source constitue la seule référence de consultation.</strong> Toute lecture assistée présentée ici est une proposition non validée, générée automatiquement, pouvant contenir des erreurs (noms, dates, lieux). Les annotations sont des propositions de relecture et ne constituent pas une transcription validée.
            </p>
         </div>
      </div>

      <section className="mx-auto grid max-w-[1600px] gap-8 px-6 pb-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        {/* LEFT COLUMN : IMAGE */}
        <div className="space-y-6">
          <section className="border border-paper-border bg-paper shadow-sm">
            <div className="border-b border-paper-border bg-background/50 px-5 py-3 flex justify-between items-center">
              <h2 className="font-serif text-xl font-medium text-foreground truncate" title={asset.localJpgFileName}>
                Document Source
              </h2>
              <div className="flex gap-3">
                <SourceLink href={asset.publicUrl}>Ouvrir l&apos;image</SourceLink>
              </div>
            </div>
            <div className="bg-background p-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`Image source - ${asset.localJpgFileName}`}
                className="max-h-[85vh] w-auto max-w-full border border-paper-border object-contain shadow-sm"
                src={asset.publicUrl}
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN : READING & METADATA */}
        <aside className="space-y-6">
          {/* ASSISTED READING */}
          {assistedReading?.status === "assisted_unverified" ? (
            <AssistedReadingPanel reading={assistedReading} reviewItem={reviewItem} />
          ) : (
            <MissingAssistedReadingPanel note={assistedReading?.note} />
          )}

          {/* ANNOTATIONS (WORK IN PROGRESS) */}
          <section className="border border-paper-border bg-paper shadow-sm">
            <div className="border-b border-paper-border bg-background/50 px-5 py-3">
              <h2 className="font-serif text-xl font-medium text-foreground flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-warm" />
                Propositions de relecture
              </h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-foreground/70 mb-4 italic">
                Les annotations ci-dessous sont des propositions d&apos;enrichissement ou de correction. Elles ne constituent pas une transcription validée.
              </p>
              <DocumentAnnotations lotId={batch.lotId} reviewId={reviewItem.reviewId} />
              {humanReviewNote && (
                <div className="mt-6 border-t border-paper-border pt-4">
                  <HumanReviewNotesPanel note={humanReviewNote} />
                </div>
              )}
            </div>
          </section>

          {/* TECHNICAL DETAILS (COLLAPSIBLE) */}
          <details className="group border border-paper-border bg-background shadow-sm open:bg-paper">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-mono text-xs font-semibold uppercase tracking-widest text-foreground/70 hover:text-foreground">
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              Détails techniques et métadonnées
            </summary>
            <div className="border-t border-paper-border p-5 space-y-8">

              <div className="space-y-4 text-sm text-foreground/80">
                <h3 className="font-serif text-lg text-foreground border-b border-paper-border pb-2">Informations de l&apos;image</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <MetaItem label="Collection" value={asset.collectionId} />
                  <MetaItem label="Statut de publication" value={asset.publicationStatus} />
                  <MetaItem label="Validation" value={asset.validationStatus} />
                  <MetaItem label="Nom du fichier" value={asset.localJpgFileName} />
                </dl>
              </div>

              {languageDetection && (
                <div className="space-y-4 text-sm text-foreground/80">
                  <h3 className="font-serif text-lg text-foreground border-b border-paper-border pb-2">Détection linguistique (Auto)</h3>
                  <div className="flex gap-2 mb-2">
                    <StatusBadge variant="neutral">{getLanguageLabel(languageDetection.detectedLanguages)}</StatusBadge>
                    <StatusBadge variant="neutral">Confiance: {languageDetection.confidence}</StatusBadge>
                  </div>
                  <dl className="grid grid-cols-2 gap-4">
                    <MetaItem label="Langues" value={languageDetection.detectedLanguages.join(", ")} />
                    <MetaItem label="Écritures" value={languageDetection.detectedScripts.map(getScriptLabel).join(", ")} />
                  </dl>
                </div>
              )}

              <div className="space-y-4 text-sm text-foreground/80">
                <h3 className="font-serif text-lg text-foreground border-b border-paper-border pb-2">Modèle d&apos;export JSON</h3>
                <p className="text-xs text-foreground/60">Modèle pour relecture hors-ligne.</p>
                <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap border border-paper-border bg-background p-3 font-mono text-[10px] leading-5 text-foreground/80">
                  {humanReviewTemplate}
                </pre>
              </div>

            </div>
          </details>

        </aside>
      </section>
    </main>
  );
}

function AssistedReadingPanel({
  reading,
  reviewItem,
}: {
  reading: AssistedReadingExample;
  reviewItem: ArchiveBatchReviewItem;
}) {
  return (
    <section className="border border-paper-border bg-paper shadow-sm">
      <div className="border-b border-paper-border bg-background/50 px-5 py-3 flex flex-wrap gap-3 items-center justify-between">
        <h2 className="font-serif text-xl font-medium text-foreground">
          Lecture assistée
        </h2>
        <StatusBadge variant="warning">Non validée</StatusBadge>
      </div>

      <div className="p-5">
        <div className="mx-auto max-w-prose">
          <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground bg-background p-5 border border-paper-border">
            {reading.assistedReadingText}
          </pre>
        </div>
        <UncertaintiesList uncertainties={reading.uncertainties} />
      </div>
    </section>
  );
}

function MissingAssistedReadingPanel({
  note,
}: {
  note?: string;
}) {
  return (
    <section className="border border-paper-border bg-paper p-6 shadow-sm">
      <h2 className="font-serif text-xl font-medium text-foreground">
        Lecture assistée indisponible
      </h2>
      <p className="mt-2 text-sm leading-6 text-foreground/70 italic">
        {note ?? "Aucun texte généré n'est actuellement disponible pour cette page."}
      </p>
    </section>
  );
}

function UncertaintiesList({
  uncertainties,
}: {
  uncertainties: AssistedReadingUncertainty[];
}) {
  if (!uncertainties || uncertainties.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-paper-border/50">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm mb-3">
        Incertitudes de lecture signalées
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {uncertainties.map((uncertainty, index) => (
          <div
            className="border border-paper-border bg-background p-3 text-sm"
            key={`${uncertainty.issue}-${uncertainty.fragment}-${index}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-warm/70 border border-warm/20 px-1.5 py-0.5">
                {uncertainty.issue}
              </span>
            </div>
            <p className="font-medium text-foreground mb-1">
              &laquo; {uncertainty.fragment} &raquo;
            </p>
            {uncertainty.suggestion && (
              <p className="text-foreground/80 text-xs">
                Sugg: {uncertainty.suggestion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HumanReviewNotesPanel({ note }: { note: HumanReviewNote }) {
  return (
    <div className="space-y-4 text-sm">
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
        Historique de modération
      </h3>
      {note.proposedTranscription && (
        <ReviewTextBlock label="Transcription proposée" value={note.proposedTranscription} />
      )}
      {note.notes && <ReviewTextBlock label="Notes générales" value={note.notes} />}
      {note.properNamesNotes && <ReviewTextBlock label="Noms propres" value={note.properNamesNotes} />}
      {note.placesNotes && <ReviewTextBlock label="Lieux" value={note.placesNotes} />}
      {note.datesNotes && <ReviewTextBlock label="Dates" value={note.datesNotes} />}
      {note.acronymsNotes && <ReviewTextBlock label="Sigles" value={note.acronymsNotes} />}
      <p className="text-xs text-foreground/50 text-right mt-2">
        Proposé par {note.reviewedBy ?? "Anonyme"} {note.reviewedAt ? `le ${note.reviewedAt}` : ""}
      </p>
    </div>
  );
}

function ReviewTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-foreground/70 mb-1">{label}</p>
      <div className="whitespace-pre-wrap border-l-2 border-warm/30 bg-background/50 px-3 py-2 text-foreground/80">
        {value}
      </div>
    </div>
  );
}

function SourceLink({ children, href }: { children: string; href: string }) {
  return (
    <a
      className="inline-flex items-center gap-1.5 text-xs font-medium text-warm hover:text-foreground transition-colors"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground break-all">{value}</dd>
    </div>
  );
}

function getHumanReviewTemplate(lotId: string, reviewId: string): string {
  return JSON.stringify(
    {
      lotId,
      reviewId,
      status: "correction_proposed",
      proposedTranscription: "",
      notes: "",
      properNamesNotes: "",
      placesNotes: "",
      datesNotes: "",
      acronymsNotes: "",
      reviewedBy: "",
      reviewedAt: "",
      validated: false,
    },
    null,
    2,
  );
}
