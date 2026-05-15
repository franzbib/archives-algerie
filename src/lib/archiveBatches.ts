import archiveBatchesManifest from "../../data/generated/archive-batches.example.json";
import flnW4AssistedReadings from "../../data/generated/batches/lot-fln-w4-001/assisted-readings.json";
import flnW4PublicAssets from "../../data/generated/batches/lot-fln-w4-001/public-assets.json";
import flnW4SecondAssistedReadings from "../../data/generated/batches/lot-fln-w4-002/assisted-readings.json";
import flnW4SecondPublicAssets from "../../data/generated/batches/lot-fln-w4-002/public-assets.json";
import flnW4ThirdAssistedReadings from "../../data/generated/batches/lot-fln-w4-003/assisted-readings.json";
import flnW4ThirdPublicAssets from "../../data/generated/batches/lot-fln-w4-003/public-assets.json";
import publicBatchAssets from "../../data/generated/public-batch-assets.example.json";
import batchAssistedReadings from "../../data/generated/pilot-batch-assisted-readings.example.json";
import type {
  AssistedReadingExample,
  AssistedReadingUncertainty,
  PilotConfidence,
} from "@/lib/pilotReview";

export type ArchiveBatchStatus =
  | "planned"
  | "inventoried"
  | "processed_local"
  | "published"
  | "review_ready"
  | "published_unvalidated";
export type ArchiveBatchSourceType = "google_drive" | "manual" | "unknown";

export type ArchiveBatch = {
  lotId: string;
  collectionId: string;
  title: string;
  sourceType: ArchiveBatchSourceType;
  status: ArchiveBatchStatus;
  driveSource: {
    driveFolderUrl: string | null;
    inventoryManifest: string | null;
  };
  assetManifest: string | null;
  assistedReadingManifest: string | null;
  reviewRoute: string | null;
  legacyReviewRoute: string | null;
  itemCount: number | null;
  notes: string;
};

export type ArchiveBatchAsset = {
  collectionId: string;
  originalDriveFileId: string;
  originalDriveUrl: string;
  localJpgFile?: string;
  localJpgFileName: string;
  r2ObjectKey: string;
  publicUrl: string;
  publicationStatus: "image_published_unvalidated";
  validationStatus: "unverified";
  reviewId: string;
  note: string;
};

export type ArchiveBatchReviewItem = {
  reviewId: string;
  assetFileName: string;
  publicAssetId: string;
  reviewStatus: "assisted_unverified" | "image_only";
  humanValidationStatus: "not_validated";
  confidence: PilotConfidence;
  notes: string;
};

type ArchiveBatchesManifest = {
  batches: ArchiveBatch[];
};

export type ArchiveBatchType = "images" | "pdf" | "planned" | "unknown";

type AssetManifest = {
  assets: RawArchiveBatchAsset[];
};

type RawArchiveBatchAsset = Omit<ArchiveBatchAsset, "localJpgFileName" | "reviewId"> & {
  localJpgFile?: string;
  localJpgFileName?: string;
  reviewId?: string;
};

const batches = (archiveBatchesManifest as ArchiveBatchesManifest).batches;
const assetManifestRegistry: Record<string, AssetManifest> = {
  "data/generated/batches/lot-fln-w4-001/public-assets.json":
    flnW4PublicAssets as AssetManifest,
  "data/generated/batches/lot-fln-w4-002/public-assets.json":
    flnW4SecondPublicAssets as AssetManifest,
  "data/generated/batches/lot-fln-w4-003/public-assets.json":
    flnW4ThirdPublicAssets as AssetManifest,
  "data/generated/public-batch-assets.example.json": publicBatchAssets as AssetManifest,
};
const assistedReadingManifestRegistry: Record<string, AssistedReadingExample[]> = {
  "data/generated/batches/lot-fln-w4-001/assisted-readings.json":
    flnW4AssistedReadings as AssistedReadingExample[],
  "data/generated/batches/lot-fln-w4-002/assisted-readings.json":
    flnW4SecondAssistedReadings as AssistedReadingExample[],
  "data/generated/batches/lot-fln-w4-003/assisted-readings.json":
    flnW4ThirdAssistedReadings as AssistedReadingExample[],
  "data/generated/pilot-batch-assisted-readings.example.json":
    batchAssistedReadings as AssistedReadingExample[],
};

export type { AssistedReadingExample, AssistedReadingUncertainty, PilotConfidence };

export function getArchiveBatches(): ArchiveBatch[] {
  return batches;
}

export function getArchiveBatchById(lotId: string): ArchiveBatch | undefined {
  return batches.find((batch) => batch.lotId === lotId);
}

export function isArchiveBatchReviewReady(batch: ArchiveBatch): boolean {
  return (
    (batch.status === "review_ready" ||
      batch.status === "published" ||
      batch.status === "published_unvalidated") &&
    getAssetsForBatch(batch).length > 0
  );
}

export function getAssetsForBatch(batch: ArchiveBatch): ArchiveBatchAsset[] {
  if (!batch.assetManifest) return [];

  return (assetManifestRegistry[batch.assetManifest]?.assets ?? []).map(
    normalizeArchiveBatchAsset,
  );
}

export function getAssistedReadingsForBatch(
  batch: ArchiveBatch,
): AssistedReadingExample[] {
  if (!batch.assistedReadingManifest) return [];

  return assistedReadingManifestRegistry[batch.assistedReadingManifest] ?? [];
}

export function getArchiveBatchReviewItems(
  batch: ArchiveBatch,
): ArchiveBatchReviewItem[] {
  const readings = getAssistedReadingsForBatch(batch);

  return getAssetsForBatch(batch).map((asset) => {
    const reading = readings.find((item) => item.reviewId === asset.reviewId);

    return {
      reviewId: asset.reviewId,
      assetFileName: asset.localJpgFileName,
      publicAssetId: asset.r2ObjectKey,
      reviewStatus: reading ? "assisted_unverified" : "image_only",
      humanValidationStatus: "not_validated",
      confidence: reading?.confidence ?? "low",
      notes: reading
        ? "Lecture assistee non validee disponible."
        : "Image publiee ; lecture assistee non disponible.",
    };
  });
}

export function getArchiveBatchReviewItemById(
  batch: ArchiveBatch,
  reviewId: string,
): ArchiveBatchReviewItem | undefined {
  return getArchiveBatchReviewItems(batch).find((item) => item.reviewId === reviewId);
}

export function getArchiveBatchAssetForReview(
  batch: ArchiveBatch,
  reviewItem: ArchiveBatchReviewItem,
): ArchiveBatchAsset | undefined {
  return getAssetsForBatch(batch).find(
    (asset) =>
      asset.reviewId === reviewItem.reviewId ||
      asset.localJpgFileName === reviewItem.assetFileName ||
      asset.r2ObjectKey === reviewItem.publicAssetId,
  );
}

export function getAssistedReadingForArchiveBatchReview(
  batch: ArchiveBatch,
  reviewItem: ArchiveBatchReviewItem,
): AssistedReadingExample | null {
  return (
    getAssistedReadingsForBatch(batch).find(
      (reading) => reading.reviewId === reviewItem.reviewId,
    ) ?? null
  );
}

export function getArchiveBatchSummary(batch: ArchiveBatch) {
  const reviewItems = getArchiveBatchReviewItems(batch);
  const assistedReadingCount = reviewItems.filter(
    (item) => item.reviewStatus === "assisted_unverified",
  ).length;

  return {
    assetCount: getAssetsForBatch(batch).length,
    assistedReadingCount,
    imageOnlyCount: reviewItems.length - assistedReadingCount,
  };
}

export function getArchiveBatchPageCount(batch: ArchiveBatch): number {
  return batch.itemCount ?? getAssetsForBatch(batch).length;
}

export function getArchiveBatchType(batch: ArchiveBatch): ArchiveBatchType {
  const assets = getAssetsForBatch(batch);

  if (assets.length > 0) return "images";
  if (batch.notes.toLowerCase().includes("pdf")) return "pdf";
  if (batch.status === "planned") return "planned";

  return "unknown";
}

export function getArchiveBatchTypeLabel(batch: ArchiveBatch): string {
  const type = getArchiveBatchType(batch);

  if (type === "images") return "Lot d'images publiees";
  if (type === "pdf") return "Lot PDF a preparer";
  if (type === "planned") return "Lot planifie";

  return "Type non renseigne";
}

function normalizeArchiveBatchAsset(asset: RawArchiveBatchAsset): ArchiveBatchAsset {
  const localJpgFileName =
    asset.localJpgFileName ?? getFileNameFromPath(asset.localJpgFile ?? asset.r2ObjectKey);

  return {
    ...asset,
    localJpgFileName,
    reviewId: asset.reviewId ?? getReviewIdFromFileName(localJpgFileName),
  };
}

function getFileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function getReviewIdFromFileName(fileName: string): string {
  const match = fileName.match(/^(\d{1,4})[-_]/);
  if (!match) {
    return fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  }

  return `page-${match[1].padStart(2, "0")}`;
}
