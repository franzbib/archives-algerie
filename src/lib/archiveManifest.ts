import manifest from "@/data/archives-manifest.json";
import type {
  ArchiveManifest,
  ArchiveManifestCollection,
  ArchiveManifestSummary,
  ArchiveProcessingStatus,
} from "@/types/archive";

export const archiveProcessingStatuses = [
  "to_inventory",
  "inventoried",
  "ocr_pending",
  "ocr_done",
  "indexed",
  "verified",
] as const satisfies readonly ArchiveProcessingStatus[];

const archiveManifest = manifest as ArchiveManifest;

export function getArchiveManifest(): ArchiveManifest {
  return archiveManifest;
}

export function getManifestCollections(): ArchiveManifestCollection[] {
  return archiveManifest.collections;
}

export function getArchiveManifestSummary(): ArchiveManifestSummary {
  return archiveManifest.collections.reduce<ArchiveManifestSummary>(
    (summary, collection) => ({
      collections: summary.collections + 1,
      byStatus: {
        ...summary.byStatus,
        [collection.processingStatus]: summary.byStatus[collection.processingStatus] + 1,
      },
    }),
    {
      collections: 0,
      byStatus: createEmptyStatusCounts(),
    },
  );
}

export function getProcessingStatusLabel(status: ArchiveProcessingStatus): string {
  const labels: Record<ArchiveProcessingStatus, string> = {
    to_inventory: "A inventorier",
    inventoried: "Inventorie",
    ocr_pending: "OCR a faire",
    ocr_done: "OCR termine",
    indexed: "Indexe",
    verified: "Verifie",
  };

  return labels[status];
}

function createEmptyStatusCounts(): Record<ArchiveProcessingStatus, number> {
  return archiveProcessingStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {} as Record<ArchiveProcessingStatus, number>,
  );
}
