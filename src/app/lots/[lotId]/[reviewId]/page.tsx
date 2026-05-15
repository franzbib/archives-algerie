import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
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
  ArchiveBatchAsset,
  ArchiveBatchReviewItem,
  AssistedReadingExample,
  AssistedReadingUncertainty,
} from "@/lib/archiveBatches";
import {
  getHumanReviewNote,
  getHumanReviewStatusLabel,
  type HumanReviewNote,
} from "@/lib/humanReviews";

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
  const humanReviewNote = getHumanReviewNote(batch.lotId, reviewItem.reviewId);
  const humanReviewTemplate = getHumanReviewTemplate(batch.lotId, reviewItem.reviewId);
  const reviewItems = getArchiveBatchReviewItems(batch);
  const currentIndex = reviewItems.findIndex((item) => item.reviewId === reviewId);
  const positionLabel = `Page ${currentIndex + 1} / ${reviewItems.length}`;
  const prevItem = currentIndex > 0 ? reviewItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex < reviewItems.length - 1 ? reviewItems[currentIndex + 1] : null;

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4 lg:px-8">
          <div className="flex flex-1 items-center gap-2 text-sm">
            <Link href="/" className="text-warm hover:text-foreground">Accueil</Link>
            <span className="text-paper-border">/</span>
            <Link href="/lots" className="text-warm hover:text-foreground">Lots</Link>
            <span className="text-paper-border">/</span>
            <Link href={`/lots/${batch.lotId}`} className="text-warm hover:text-foreground truncate max-w-[120px] sm:max-w-[250px]">
              {batch.title}
            </Link>
            <span className="text-paper-border">/</span>
            <span className="text-foreground/70 truncate max-w-[100px] sm:max-w-[150px]">
              Fichier {currentIndex + 1}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-6 text-sm font-medium">
            {prevItem ? (
              <Link
                href={`/lots/${batch.lotId}/${prevItem.reviewId}`}
                className="text-foreground hover:text-warm"
              >
                &larr; Precedent
              </Link>
            ) : (
              <span className="text-foreground/30">&larr; Precedent</span>
            )}
            <span className="text-foreground/50">{positionLabel}</span>
            {nextItem ? (
              <Link
                href={`/lots/${batch.lotId}/${nextItem.reviewId}`}
                className="text-foreground hover:text-warm"
              >
                Suivant &rarr;
              </Link>
            ) : (
              <span className="text-foreground/30">Suivant &rarr;</span>
            )}
          </div>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge variant="warning">Non valide</StatusBadge>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Lot : {batch.lotId} &mdash; Collection : {batch.collectionId}
            </p>
          </div>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            {batch.title} &mdash; Fichier {currentIndex + 1} sur {reviewItems.length}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page affiche une image publiee et sa lecture assistee
            eventuelle. Elle ne valide ni la page, ni le document, ni la
            transcription.
          </p>
          <dl className="mt-8 grid gap-4 border border-paper-border bg-background/60 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="LotId" value={batch.lotId} />
            <MetaItem label="CollectionId" value={batch.collectionId} />
            <MetaItem label="ReviewId" value={reviewItem.reviewId} />
            <MetaItem label="Position" value={positionLabel} />
            <MetaItem label="Fichier source" value={asset.localJpgFileName} />
            <MetaItem label="Statut image" value={asset.validationStatus} />
            <MetaItem label="Statut lecture" value={reviewItem.reviewStatus} />
            <MetaItem label="Validation" value="Non validee" />
          </dl>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:px-8">
        <section className="space-y-8">
          <SourceVisual asset={asset} reviewItem={reviewItem} />
          <MethodologyBlock assistedReading={assistedReading} />
        </section>

        <aside className="space-y-8">
          {assistedReading ? (
            <AssistedReadingPanel reading={assistedReading} reviewItem={reviewItem} />
          ) : (
            <MissingAssistedReadingPanel reviewItem={reviewItem} />
          )}
          <HumanValidationPanel />
          <CopyableHumanReviewTemplate template={humanReviewTemplate} />
          {humanReviewNote && <HumanReviewNotesPanel note={humanReviewNote} />}
        </aside>
      </section>
    </main>
  );
}

function SourceVisual({
  asset,
  reviewItem,
}: {
  asset: ArchiveBatchAsset;
  reviewItem: ArchiveBatchReviewItem;
}) {
  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          A. Source visuelle
        </p>
        <h2 className="mt-1 break-all font-serif text-2xl font-medium text-foreground">
          {asset.localJpgFileName}
        </h2>
      </div>

      <div className="bg-background p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Image de lot - ${asset.localJpgFileName}`}
          className="max-h-[850px] w-full border border-paper-border bg-paper object-contain"
          src={asset.publicUrl}
        />
      </div>

      <div className="space-y-5 px-5 py-5">
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <MetaItem label="Collection" value={asset.collectionId} />
          <MetaItem label="Publication" value={asset.publicationStatus} />
          <MetaItem label="Validation" value={asset.validationStatus} />
          <MetaItem label="Objet R2" value={asset.r2ObjectKey} />
          <MetaItem label="Fichier Drive" value={asset.originalDriveFileId} />
          <MetaItem label="Statut controle" value={reviewItem.reviewStatus} />
        </dl>

        <div className="border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Prudence
          </p>
          <p className="mt-2">
            Cette image n&apos;est pas encore validee comme page definitive. Son
            ordre, son rattachement documentaire et sa transcription restent a
            verifier.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <SourceLink href={asset.publicUrl}>Lien R2</SourceLink>
          <SourceLink href={asset.originalDriveUrl}>Drive d&apos;origine</SourceLink>
        </div>
      </div>
    </section>
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
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          B. Lecture assistee non validee
        </p>
        <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
          Texte propose
        </h2>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant="warning">{reading.status}</StatusBadge>
          <StatusBadge variant="neutral">
            Validation humaine : {reading.humanValidation.validated ? "oui" : "non"}
          </StatusBadge>
          <StatusBadge variant="warning">
            Confiance : {reading.confidence ?? reviewItem.confidence}
          </StatusBadge>
        </div>

        <div className="border border-paper-border bg-background p-4">
          <div className="flex items-start gap-3 text-sm leading-6 text-foreground/80">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <p>
              Cette lecture assistee est non validee. Les noms propres, lieux,
              dates et sigles doivent etre controles sur l&apos;image avant toute
              citation ou indexation.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-prose">
          <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap border border-paper-border bg-background p-6 font-serif text-base leading-relaxed text-foreground">
            {reading.assistedReadingText}
          </pre>
        </div>

        <UncertaintiesList uncertainties={reading.uncertainties} />
      </div>
    </section>
  );
}

function MissingAssistedReadingPanel({
  reviewItem,
}: {
  reviewItem: ArchiveBatchReviewItem;
}) {
  return (
    <section className="border border-paper-border bg-paper p-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        B. Lecture assistee non disponible
      </p>
      <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
        Image seule
      </h2>
      <p className="mt-4 text-sm leading-6 text-foreground/80">
        Statut de controle : {reviewItem.reviewStatus}. L&apos;image peut etre
        consultee, mais elle ne doit pas etre consideree comme page/document
        valide.
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
    <section className="pt-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        Incertitudes principales ({uncertainties.length})
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {uncertainties.map((uncertainty, index) => (
          <div
            className="border border-paper-border bg-background p-4 text-sm"
            key={`${uncertainty.issue}-${uncertainty.fragment}-${index}`}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-paper-border pb-3">
              <StatusBadge variant="warning">{uncertainty.confidence}</StatusBadge>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
                {uncertainty.issue}
              </span>
            </div>
            <div className="pt-3">
              <p className="font-medium text-foreground">
                &laquo; {uncertainty.fragment} &raquo;
              </p>
              {uncertainty.suggestion && (
                <p className="mt-2 text-foreground/80">
                  <span className="text-foreground/60">Suggestion :</span>{" "}
                  {uncertainty.suggestion}
                </p>
              )}
              {uncertainty.note && (
                <p className="mt-2 leading-relaxed text-foreground/70">
                  {uncertainty.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MethodologyBlock({
  assistedReading,
}: {
  assistedReading: AssistedReadingExample | null;
}) {
  return (
    <section className="border border-paper-border bg-paper p-6">
      <div className="flex items-start gap-3">
        <FileWarning className="mt-1 h-5 w-5 shrink-0 text-warm" />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Couches textuelles
          </p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
            <p>OCR brut produit localement, mais non publie dans l&apos;application.</p>
            <p>OCR nettoye produit localement, mais non publie dans l&apos;application.</p>
            <p>
              {assistedReading
                ? "Lecture assistee affichee comme hypothese non validee."
                : "Lecture assistee non disponible pour cet item."}
            </p>
            <p>Transcription validee non disponible.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HumanValidationPanel() {
  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-warm" />
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            C. Validation humaine future
          </p>
        </div>
        <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
          A verifier sur l&apos;image
        </h2>
      </div>

      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge variant="warning">Non valide</StatusBadge>
          <StatusBadge variant="neutral">Transcription non disponible</StatusBadge>
        </div>

        <p className="mb-4 text-sm leading-6 text-foreground/80">
          Les entites suivantes doivent etre imperativement controlees avant toute citation ou indexation historique :
        </p>

        <ul className="mb-6 space-y-2 text-sm font-medium text-foreground/90">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warm"></span> Noms propres et patronymes</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warm"></span> Lieux et toponymes</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warm"></span> Dates et chronologie</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warm"></span> Sigles et abreviations</li>
        </ul>

        <div className="border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/75">
          <p>Aucun workflow d&apos;edition n&apos;est actif dans cette etape generique.</p>
        </div>
      </div>
    </section>
  );
}

function CopyableHumanReviewTemplate({ template }: { template: string }) {
  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          D. Fiche de relecture a copier
        </p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
          Modele JSON non persistant
        </h2>
      </div>

      <div className="space-y-4 p-5">
        <div className="border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
          <p>
            Ce modele sert a preparer une proposition de relecture hors de
            l&apos;application. Il ne sauvegarde rien, ne valide rien et ne modifie
            pas la lecture assistee.
          </p>
        </div>

        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap border border-paper-border bg-background p-4 font-mono text-xs leading-6 text-foreground">
          {template}
        </pre>
      </div>
    </section>
  );
}

function HumanReviewNotesPanel({ note }: { note: HumanReviewNote }) {
  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          D. Notes de relecture humaine
        </p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
          Couche humaine non interactive
        </h2>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={note.validated ? "success" : "warning"}>
            {getHumanReviewStatusLabel(note.status)}
          </StatusBadge>
          <StatusBadge variant="neutral">
            Validation explicite : {note.validated ? "oui" : "non"}
          </StatusBadge>
        </div>

        <div className="border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
          <p>
            Ces notes constituent une couche separee de la lecture assistee IA.
            Elles ne remplacent pas l&apos;image source et ne valident pas la
            transcription sans statut explicite.
          </p>
        </div>

        {note.proposedTranscription && (
          <ReviewTextBlock
            label="Proposition de transcription humaine"
            value={note.proposedTranscription}
          />
        )}
        {note.notes && <ReviewTextBlock label="Notes generales" value={note.notes} />}
        {note.properNamesNotes && (
          <ReviewTextBlock label="Noms propres" value={note.properNamesNotes} />
        )}
        {note.placesNotes && <ReviewTextBlock label="Lieux" value={note.placesNotes} />}
        {note.datesNotes && <ReviewTextBlock label="Dates" value={note.datesNotes} />}
        {note.acronymsNotes && (
          <ReviewTextBlock label="Sigles" value={note.acronymsNotes} />
        )}

        <dl className="grid gap-4 border-t border-paper-border pt-4 text-sm">
          <MetaItem label="Relecteur" value={note.reviewedBy ?? "Non renseigne"} />
          <MetaItem
            label="Derniere modification"
            value={note.reviewedAt ?? "Non renseignee"}
          />
        </dl>
      </div>
    </section>
  );
}

function ReviewTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </p>
      <div className="mt-2 whitespace-pre-wrap border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
        {value}
      </div>
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
