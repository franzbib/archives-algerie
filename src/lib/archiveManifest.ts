import manifest from "@/data/archives-manifest.json";
import type {
  ArchiveFacets,
  ArchiveManifest,
  ArchiveManifestSummary,
  ArchiveStatus,
  Collection,
  Document,
  DocumentType,
  ReliabilityLevel,
} from "@/types/archive";

export const archiveStatuses = [
  "to_inventory",
  "inventoried",
  "ocr_pending",
  "ocr_done",
  "indexed",
  "verified",
] as const satisfies readonly ArchiveStatus[];

export const archiveProcessingStatuses = archiveStatuses;

const archiveManifest = manifest as ArchiveManifest;

export function getArchiveManifest(): ArchiveManifest {
  return archiveManifest;
}

export function getCollections(): Collection[] {
  return archiveManifest.collections;
}

export function getManifestCollections(): Collection[] {
  return getCollections();
}

export function getCollectionById(id: string): Collection | undefined {
  return archiveManifest.collections.find((collection) => collection.id === id);
}

export function getDocuments(): Document[] {
  return archiveManifest.documents;
}

export function getDocumentsByCollectionId(collectionId: string): Document[] {
  return archiveManifest.documents.filter(
    (document) => document.collectionId === collectionId,
  );
}

export function getDocumentById(id: string): Document | undefined {
  return archiveManifest.documents.find((document) => document.id === id);
}

export function getCollectionForDocument(document: Document): Collection | undefined {
  return getCollectionById(document.collectionId);
}

export function getArchiveManifestSummary(): ArchiveManifestSummary {
  return archiveManifest.collections.reduce<ArchiveManifestSummary>(
    (summary, collection) => ({
      collections: summary.collections + 1,
      documents: summary.documents + collection.documentCount,
      byStatus: {
        ...summary.byStatus,
        [collection.status]: summary.byStatus[collection.status] + 1,
      },
    }),
    {
      collections: 0,
      documents: 0,
      byStatus: createEmptyStatusCounts(),
    },
  );
}

export function getArchiveFacets(): ArchiveFacets {
  return {
    references: unique(archiveManifest.collections.map((item) => item.archiveReference)),
    regions: unique(archiveManifest.collections.map((item) => item.region)),
    periods: unique(archiveManifest.collections.map((item) => item.period)),
    documentTypes: unique(
      archiveManifest.documents.map((document) => document.documentType),
    ) as DocumentType[],
    statuses: [...archiveStatuses],
  };
}

export function getStatusLabel(status: ArchiveStatus): string {
  const labels: Record<ArchiveStatus, string> = {
    to_inventory: "A inventorier",
    inventoried: "Inventorie",
    ocr_pending: "OCR a faire",
    ocr_done: "OCR termine",
    indexed: "Indexe",
    verified: "Verifie",
  };

  return labels[status];
}

export function getProcessingStatusLabel(status: ArchiveStatus): string {
  return getStatusLabel(status);
}

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    renseignement: "Renseignement",
    rapport: "Rapport",
    correspondance: "Correspondance",
    tract: "Tract",
    carte: "Carte",
    microfilm: "Microfilm",
    photographie: "Photographie",
    temoignage: "Temoignage",
    autre: "Autre",
  };

  return labels[type];
}

export function hasV1Enrichment(collection: Collection): boolean {
  return Boolean(
    collection.archivalScope ||
      collection.historicalContext ||
      collection.provenanceNote ||
      collection.processingNotes ||
      collection.placesMentioned?.length ||
      collection.organizationsMentioned?.length ||
      collection.peopleMentioned?.length ||
      collection.uncertaintyNotes ||
      collection.reliabilityLevel,
  );
}

export function getReliabilityLevelLabel(level: ReliabilityLevel): string {
  const labels: Record<ReliabilityLevel, string> = {
    low: "Faible",
    medium: "Moyen",
    high: "Élevé",
    to_verify: "À vérifier",
  };

  return labels[level];
}

function createEmptyStatusCounts(): Record<ArchiveStatus, number> {
  return archiveStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {} as Record<ArchiveStatus, number>,
  );
}

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
