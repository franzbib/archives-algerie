export type ArchiveProcessingStatus =
  | "to_inventory"
  | "inventoried"
  | "ocr_pending"
  | "ocr_done"
  | "indexed"
  | "verified";

export interface ArchiveManifest {
  schemaVersion: string;
  updatedAt: string;
  collections: ArchiveManifestCollection[];
}

export interface ArchiveManifestCollection {
  id: string;
  title: string;
  source: string;
  region: string;
  period: ArchivePeriod;
  processingStatus: ArchiveProcessingStatus;
  driveFolderUrl: string;
  notes?: string;
}

export interface ArchivePeriod {
  start: string;
  end?: string;
  label: string;
}

export interface ArchiveManifestSummary {
  collections: number;
  byStatus: Record<ArchiveProcessingStatus, number>;
}
