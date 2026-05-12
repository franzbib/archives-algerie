import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Search,
  ShieldCheck,
  ZoomIn,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCollectionForDocument,
  getDocumentById,
  getDocuments,
  getDocumentTypeLabel,
  getStatusLabel,
} from "@/lib/archiveManifest";
import type { ArchiveStatus } from "@/types/archive";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDocuments().map((document) => ({ id: document.id }));
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = getDocumentById(id);

  if (!document) {
    notFound();
  }

  const collection = getCollectionForDocument(document);

  if (!collection) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/collections/${collection.id}`}
              className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour a la collection
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              Liste des collections
            </Link>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-warm">
            Fiche document
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="border border-paper-border bg-paper p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                {displayValue(document.archiveReference ?? collection.archiveReference)}
              </p>
              <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
                {displayValue(document.title)}
              </h1>
              <p className="mt-3 text-sm leading-6 text-foreground/80">
                Collection parente :{" "}
                <Link
                  href={`/collections/${collection.id}`}
                  className="font-medium underline decoration-paper-border underline-offset-4 hover:text-warm"
                >
                  {displayValue(collection.title)}
                </Link>
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:items-end">
              <StatusBadge variant={statusVariant(document.ocrStatus)}>
                {getStatusLabel(document.ocrStatus)}
              </StatusBadge>
              <DriveLink href={document.driveUrl} />
            </div>
          </div>

          <dl className="mt-8 grid gap-4 border-t border-paper-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Type documentaire" value={getDocumentTypeLabel(document.documentType)} />
            <MetaItem label="Date" value={document.dateLabel} />
            <MetaItem label="Lieu" value={document.place} />
            <MetaItem label="Dossier" value={document.folderTitle} />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ConsultationPanel
              icon={<ImageIcon className="h-5 w-5" />}
              title="Source numerisee"
              body="Aucune image locale n'est encore disponible pour cette fiche. La source reste referencee par le manifeste et pourra etre consultee depuis Drive si un lien est renseigne."
              footer={<DriveLink href={document.driveUrl} compact />}
              tools={[
                { icon: <ChevronLeft className="h-4 w-4" />, label: "Page precedente" },
                { icon: <ChevronRight className="h-4 w-4" />, label: "Page suivante" },
                { icon: <ZoomIn className="h-4 w-4" />, label: "Zoom" },
                { icon: <Maximize2 className="h-4 w-4" />, label: "Plein ecran" },
              ]}
            />
            <ConsultationPanel
              icon={<FileText className="h-5 w-5" />}
              title="Transcription OCR"
              badge={
                <StatusBadge variant={statusVariant(document.ocrStatus)}>
                  {getStatusLabel(document.ocrStatus)}
                </StatusBadge>
              }
              body="OCR non disponible pour l'instant. Aucun texte OCR n'est affiche tant qu'un fichier produit et verifie n'est pas rattache a cette page."
              footer={
                <p className="text-xs leading-5 text-warm">
                  Emplacement futur pour correction, validation humaine et suivi
                  qualite.
                </p>
              }
            />
          </div>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-5 w-5 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Metadonnees structurees
                </p>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Identification documentaire
                </h2>
              </div>
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <MetaItem label="Collection" value={collection.title} />
              <MetaItem label="Institution source" value={collection.sourceInstitution} />
              <MetaItem label="Cote" value={document.archiveReference ?? collection.archiveReference} />
              <MetaItem label="Titre" value={document.title} />
              <MetaItem label="Type documentaire" value={getDocumentTypeLabel(document.documentType)} />
              <MetaItem label="Date" value={document.dateLabel} />
              <MetaItem label="Lieu" value={document.place} />
              <MetaItem
                label="Personnes mentionnees"
                value={formatPeople(document.peopleMentioned)}
              />
              <MetaItem label="Mots-cles" value={formatKeywords(document.keywords)} />
            </dl>

            <div className="mt-6 border-t border-paper-border pt-5">
              <MetaItem label="Resume" value={document.summary} />
            </div>
          </section>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Search className="h-5 w-5 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Preparation recherche sourcee
                </p>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Pages referencees
                </h2>
              </div>
            </div>

            {document.pages?.length ? (
              <div className="grid gap-3">
                {document.pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-col gap-2 border border-paper-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-warm">
                        Page {page.pageNumber}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{page.label}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge variant="neutral">{page.imageStatus}</StatusBadge>
                      <StatusBadge variant="warning">
                        {getStatusLabel(page.ocrTextStatus)}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-paper-border bg-paper/30 p-8 text-center text-sm leading-6 text-warm">
                Aucune page n&apos;est encore decrite. Cette fiche reste un point
                d&apos;ancrage pour le futur decoupage en pages.
              </div>
            )}
          </section>

          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Prudence documentaire
                </p>
                <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
                  Consultation preparatoire
                </h2>
                <p className="mt-3 text-sm leading-6 text-foreground/80">
                  Les informations affichees viennent uniquement du manifeste
                  local. L&apos;OCR n&apos;est pas encore actif dans l&apos;application,
                  l&apos;analyse historienne n&apos;est pas automatisee, et la recherche
                  IA n&apos;est pas disponible.
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground/80">
                  Toute future reponse IA devra citer la collection, la cote, le
                  document, la page et l&apos;extrait OCR utilise, avec des limites
                  clairement indiquees.
                </p>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function MetaItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 font-medium leading-6 text-foreground">
        {displayValue(value)}
      </dd>
    </div>
  );
}

function DriveLink({
  href,
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  if (!href || href.trim().length === 0) {
    return (
      <p className={compact ? "text-sm text-warm" : "text-sm text-warm"}>
        Lien Drive non renseigné
      </p>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        compact
          ? "inline-flex w-fit items-center gap-2 text-sm text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
          : "inline-flex w-fit items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm text-foreground"
      }
    >
      Dossier Drive
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function ConsultationPanel({
  icon,
  title,
  body,
  badge,
  footer,
  tools = [],
}: {
  icon: ReactNode;
  title: string;
  body: string;
  badge?: ReactNode;
  footer?: ReactNode;
  tools?: { icon: ReactNode; label: string }[];
}) {
  return (
    <div className="min-h-64 border border-paper-border bg-paper p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-warm">
          {icon}
          <h2 className="font-serif text-2xl font-medium text-foreground">
            {title}
          </h2>
        </div>
        {badge}
      </div>
      <div className="mt-6 flex aspect-[4/3] items-center justify-center border-2 border-dashed border-paper-border bg-paper/30 p-6 text-center text-sm leading-6 text-warm">
        {body}
      </div>
      {tools.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              disabled
              title={`${tool.label} - a venir`}
              className="inline-flex h-9 w-9 items-center justify-center border border-paper-border bg-background text-warm opacity-70"
            >
              {tool.icon}
              <span className="sr-only">{tool.label} a venir</span>
            </button>
          ))}
        </div>
      )}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}

function formatPeople(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "Aucun nom mentionné";
}

function formatKeywords(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "Aucun mot-clé renseigné";
}

function displayValue(value: string | undefined): string {
  return value && value.trim().length > 0 ? value : "Non renseigné";
}

function statusVariant(status: ArchiveStatus) {
  if (status === "verified" || status === "indexed" || status === "ocr_done") {
    return "success";
  }

  if (status === "ocr_pending") {
    return "warning";
  }

  return "neutral";
}
