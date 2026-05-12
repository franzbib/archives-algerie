export type ArchiveStatus =
  | "to_inventory"
  | "inventoried"
  | "ocr_pending"
  | "ocr_done"
  | "indexed"
  | "verified";

export type ArchiveProcessingStatus = ArchiveStatus;

export type DocumentType =
  | "renseignement"
  | "rapport"
  | "correspondance"
  | "tract"
  | "carte"
  | "microfilm"
  | "photographie"
  | "temoignage"
  | "autre";

export interface ArchiveManifest {
  schemaVersion: string;
  updatedAt: string;
  collections: Collection[];
  documents: Document[];
}

export interface Collection {
  id: string;
  title: string;
  sourceInstitution: string;
  archiveReference: string;
  region: string;
  period: string;
  description: string;
  driveUrl: string;
  status: ArchiveStatus;
  documentCount: number;
}

export interface Document {
  id: string;
  collectionId: string;
  title: string;
  documentType: DocumentType;
  dateLabel: string;
  place: string;
  peopleMentioned: string[];
  keywords: string[];
  driveUrl: string;
  ocrStatus: ArchiveStatus;
  summary: string;
  folderTitle?: string;
  archiveReference?: string;
  pages?: ArchivePage[];
}

export interface ArchivePage {
  id: string;
  pageNumber: number;
  label: string;
  imageStatus: "placeholder" | "available";
  ocrTextStatus: ArchiveStatus;
}

export interface ArchiveManifestSummary {
  collections: number;
  documents: number;
  byStatus: Record<ArchiveStatus, number>;
}

export interface ArchiveFacets {
  references: string[];
  regions: string[];
  periods: string[];
  documentTypes: DocumentType[];
  statuses: ArchiveStatus[];
}
