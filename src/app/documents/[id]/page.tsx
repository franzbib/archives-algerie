import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCollectionForDocument,
  getDocumentById,
  getDocuments,
  getDocumentTypeLabel,
  getStatusLabel,
} from "@/lib/archiveManifest";

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link
            href={`/collections/${collection.id}`}
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la collection
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-warm">
            Fiche document
          </p>
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-6">
          <div className="border border-paper-border bg-paper p-6 shadow-sm md:p-8">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              {document.archiveReference ?? collection.archiveReference}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-medium text-foreground">
              {document.title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-foreground/80">
              {document.summary}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge variant="neutral">
                {getDocumentTypeLabel(document.documentType)}
              </StatusBadge>
              <StatusBadge variant={document.ocrStatus === "ocr_done" ? "success" : "warning"}>
                {getStatusLabel(document.ocrStatus)}
              </StatusBadge>
            </div>
          </div>

          <div className="border border-paper-border bg-paper p-6 md:p-8">
            <h2 className="font-serif text-xl font-medium text-foreground">
              Metadonnees
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <MetaItem label="Fonds" value={collection.title} />
              <MetaItem label="Dossier" value={document.folderTitle ?? "A preciser"} />
              <MetaItem label="Date" value={document.dateLabel} />
              <MetaItem label="Lieu" value={document.place} />
              <MetaItem
                label="Personnes mentionnees"
                value={
                  document.peopleMentioned.length
                    ? document.peopleMentioned.join(", ")
                    : "Non renseigne"
                }
              />
              <MetaItem label="Mots-cles" value={document.keywords.join(", ")} />
            </dl>

            <a
              href={document.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm text-foreground"
            >
              Dossier Drive
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              icon={<ImageIcon className="h-5 w-5" />}
              title="Image scannee"
              text="La V0 reserve cet emplacement pour une image issue du dossier Drive. La connexion automatique sera ajoutee plus tard."
            />
            <Panel
              icon={<FileText className="h-5 w-5" />}
              title="Texte OCR"
              text="Le texte OCR sera affiche ici quand le pipeline local aura produit les fichiers texte et metadonnees."
            />
          </div>

          <div className="border border-paper-border bg-paper p-6 md:p-8">
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
          </div>
        </section>
      </section>
    </main>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Panel({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-64 border border-paper-border bg-paper p-6 md:p-8">
      <div className="flex items-center gap-3 text-warm">
        {icon}
        <h2 className="font-serif text-2xl font-medium text-foreground">{title}</h2>
      </div>
      <div className="mt-6 flex aspect-[4/3] items-center justify-center border-2 border-dashed border-paper-border bg-paper/30 p-6 text-center text-sm leading-6 text-warm">
        {text}
      </div>
    </div>
  );
}
