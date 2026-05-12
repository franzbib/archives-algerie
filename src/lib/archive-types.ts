export type CollectionStatus = "inventoried" | "processing" | "restricted";

export type DocumentKind =
  | "correspondence"
  | "register"
  | "map"
  | "photograph"
  | "administrative-file"
  | "other";

export type PagePreservationState = "stable" | "fragile" | "damaged";

export interface ArchiveCollection {
  id: string;
  title: string;
  code: string;
  description: string;
  dateRange: DateRange;
  provenance: string;
  status: CollectionStatus;
  folders: ArchiveFolder[];
}

export interface ArchiveFolder {
  id: string;
  title: string;
  callNumber: string;
  description?: string;
  dateRange?: DateRange;
  children?: ArchiveFolder[];
  documents?: ArchiveDocument[];
}

export interface ArchiveDocument {
  id: string;
  title: string;
  callNumber: string;
  kind: DocumentKind;
  date?: string;
  language?: string[];
  physicalDescription?: string;
  rights?: string;
  pages: ArchivePage[];
}

export interface ArchivePage {
  id: string;
  pageNumber: number;
  label?: string;
  imageReference?: string;
  preservationState: PagePreservationState;
  notes?: string;
}

export interface DateRange {
  start: string;
  end?: string;
  label: string;
}

export interface ArchiveStats {
  collections: number;
  folders: number;
  documents: number;
  pages: number;
}
