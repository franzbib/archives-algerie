import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FolderArchive,
} from "lucide-react";
import { DocumentList } from "@/components/document-list";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCollectionById,
  getCollections,
  getDocumentsByCollectionId,
  getDocumentTypeLabel,
  getStatusLabel,
} from "@/lib/archiveManifest";
import type { ArchiveStatus, Document } from "@/types/archive";

type TreatmentKey = "inventory" | "ocr" | "indexing" | "verification";

interface TreatmentState {
  note: string;
  status: ArchiveStatus;
}

export function generateStaticParams() {
  return getCollections().map((collection) => ({ id: collection.id }));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = getCollectionById(id);

  if (!collection) {
    notFound();
  }

  const documents = getDocumentsByCollectionId(collection.id);
  const documentTypes = unique(
    documents.map((document) => getDocumentTypeLabel(document.documentType)),
  );
  const keywords = unique(documents.flatMap((document) => document.keywords)).slice(
    0,
    8,
  );
  const treatment = getTreatmentState(collection.status, documents);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux collections
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="border border-paper-border bg-paper p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Fonds / cote : {displayValue(collection.archiveReference)}
                </p>
                <StatusBadge variant={statusVariant(collection.status)}>
                  {getStatusLabel(collection.status)}
                </StatusBadge>
              </div>
              <h1 className="mt-4 font-serif text-4xl font-medium text-foreground">
                {displayValue(collection.title)}
              </h1>
            </div>

            <a
              href={collection.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 border border-paper-border bg-background px-4 py-2 text-sm text-foreground"
            >
              Dossier Drive
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <dl className="mt-8 grid gap-4 border-t border-paper-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Institution source" value={collection.sourceInstitution} />
            <MetaItem label="Cote" value={collection.archiveReference} />
            <MetaItem label="Region" value={collection.region} />
            <MetaItem label="Periode" value={collection.period} />
          </dl>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-8">
          <section className="border border-paper-border bg-paper p-6 md:p-8">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
              Resume
            </p>
            <p className="mt-3 text-base leading-7 text-foreground/80">
              {displayValue(collection.description)}
            </p>

            <dl className="mt-6 grid gap-4 border-t border-paper-border pt-5 text-sm sm:grid-cols-3">
              <MetaItem
                label="Documents rattaches"
                value={String(documents.length || collection.documentCount)}
              />
              <MetaItem label="Types presents" value={formatList(documentTypes)} />
              <MetaItem label="Mots-cles" value={formatList(keywords)} />
            </dl>
          </section>

          <section>
            <div className="mb-6 flex items-center gap-3 border-b border-paper-border pb-4">
              <FolderArchive className="h-5 w-5 text-warm" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                  Documents rattaches
                </p>
                <h2 className="font-serif text-2xl font-medium text-foreground">
                  Pieces de consultation
                </h2>
              </div>
            </div>
            <DocumentList documents={documents} />
          </section>
        </div>

        <aside className="h-fit border border-paper-border bg-paper p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-warm" />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                Etat du traitement
              </p>
              <h2 className="font-serif text-xl font-medium text-foreground">
                Suivi de la collection
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <TreatmentItem label="Inventaire" state={treatment.inventory} />
            <TreatmentItem label="OCR" state={treatment.ocr} />
            <TreatmentItem label="Indexation" state={treatment.indexing} />
            <TreatmentItem
              label="Verification humaine"
              state={treatment.verification}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

function TreatmentItem({
  label,
  state,
}: {
  label: string;
  state: TreatmentState;
}) {
  return (
    <div className="border-t border-paper-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="mt-1 text-sm leading-5 text-warm">{state.note}</p>
        </div>
        <StatusBadge variant={statusVariant(state.status)}>
          {getStatusLabel(state.status)}
        </StatusBadge>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{displayValue(value)}</dd>
    </div>
  );
}

function getTreatmentState(
  collectionStatus: ArchiveStatus,
  documents: Document[],
): Record<TreatmentKey, TreatmentState> {
  const documentStatuses = documents.map((document) => document.ocrStatus);
  const doneOcrCount = countStatuses(documentStatuses, [
    "ocr_done",
    "indexed",
    "verified",
  ]);
  const indexedCount = countStatuses(documentStatuses, ["indexed", "verified"]);
  const verifiedCount = countStatuses(documentStatuses, ["verified"]);

  return {
    inventory: {
      status:
        collectionStatus === "to_inventory" ? "to_inventory" : "inventoried",
      note:
        collectionStatus === "to_inventory"
          ? "Collection a inventorier."
          : "Notice de collection presente dans le manifeste.",
    },
    ocr: {
      status: resolveOcrStatus(documentStatuses),
      note:
        documents.length > 0
          ? `${doneOcrCount} document(s) avec OCR termine ou plus avance.`
          : "Non renseigné",
    },
    indexing: {
      status: indexedCount > 0 ? "indexed" : "to_inventory",
      note:
        indexedCount > 0
          ? `${indexedCount} document(s) indexe(s).`
          : "Indexation non renseignee.",
    },
    verification: {
      status:
        collectionStatus === "verified" || verifiedCount > 0
          ? "verified"
          : "to_inventory",
      note:
        collectionStatus === "verified" || verifiedCount > 0
          ? `${verifiedCount} document(s) verifie(s).`
          : "Verification humaine non renseignee.",
    },
  };
}

function resolveOcrStatus(statuses: ArchiveStatus[]): ArchiveStatus {
  if (statuses.length === 0) {
    return "to_inventory";
  }

  if (
    statuses.every((status) =>
      ["ocr_done", "indexed", "verified"].includes(status),
    )
  ) {
    return "ocr_done";
  }

  if (statuses.some((status) => status === "ocr_pending")) {
    return "ocr_pending";
  }

  return "to_inventory";
}

function countStatuses(
  statuses: ArchiveStatus[],
  accepted: ArchiveStatus[],
): number {
  return statuses.filter((status) => accepted.includes(status)).length;
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "Non renseigné";
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

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}
