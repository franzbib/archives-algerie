import archiveBatchesManifest from "../../data/generated/archive-batches.example.json";
import flnW4AssistedReadings from "../../data/generated/batches/lot-fln-w4-001/assisted-readings.json";
import flnW4PublicAssets from "../../data/generated/batches/lot-fln-w4-001/public-assets.json";
import flnW4SecondAssistedReadings from "../../data/generated/batches/lot-fln-w4-002/assisted-readings.json";
import flnW4SecondPublicAssets from "../../data/generated/batches/lot-fln-w4-002/public-assets.json";
import flnW4ThirdAssistedReadings from "../../data/generated/batches/lot-fln-w4-003/assisted-readings.json";
import flnW4ThirdPublicAssets from "../../data/generated/batches/lot-fln-w4-003/public-assets.json";
import flnW4FourthPublicAssets from "../../data/generated/batches/lot-fln-w4-004/public-assets.json";
import flnRalliementsAssistedReadings from "../../data/generated/batches/lot-fln-ralliements-001/assisted-readings.json";
import flnRalliementsPublicAssets from "../../data/generated/batches/lot-fln-ralliements-001/public-assets.json";
import gouasZaouiasAssistedReadings from "../../data/generated/batches/lot-gouas-zaouias-001/assisted-readings.json";
import gouasZaouiasPublicAssets from "../../data/generated/batches/lot-gouas-zaouias-001/public-assets.json";
import pamCimLiberesAssistedReadings from "../../data/generated/batches/lot-pam-cim-liberes-001/assisted-readings.json";
import pamCimLiberesPublicAssets from "../../data/generated/batches/lot-pam-cim-liberes-001/public-assets.json";
import lotBleuiteFlnW3Amirouche001AssistedReadings from "../../data/generated/batches/lot-bleuite-fln-w3-amirouche-001/assisted-readings.json";
import lotBleuiteFlnW3Amirouche001PublicAssets from "../../data/generated/batches/lot-bleuite-fln-w3-amirouche-001/public-assets.json";
import lotRenseignementsDz1964001AssistedReadings from "../../data/generated/batches/lot-renseignements-dz-1964-001/assisted-readings.json";
import lotRenseignementsDz1964001PublicAssets from "../../data/generated/batches/lot-renseignements-dz-1964-001/public-assets.json";
import lotBoghariVisiteFichesLiaison1959001AssistedReadings from "../../data/generated/batches/lot-boghari-visite-fiches-liaison-1959-001/assisted-readings.json";
import lotBoghariVisiteFichesLiaison1959001PublicAssets from "../../data/generated/batches/lot-boghari-visite-fiches-liaison-1959-001/public-assets.json";
import lotGeneralDurand1h1239001AssistedReadings from "../../data/generated/batches/lot-general-durand-1h1239-001/assisted-readings.json";
import lotGeneralDurand1h1239001PublicAssets from "../../data/generated/batches/lot-general-durand-1h1239-001/public-assets.json";
import lotJuifsAlgeriensLutteAnticoloniale001AssistedReadings from "../../data/generated/batches/lot-juifs-algeriens-lutte-anticoloniale-001/assisted-readings.json";
import lotJuifsAlgeriensLutteAnticoloniale001PublicAssets from "../../data/generated/batches/lot-juifs-algeriens-lutte-anticoloniale-001/public-assets.json";
import lotExemplesAmicaleGenealogistesShd001AssistedReadings from "../../data/generated/batches/lot-exemples-amicale-genealogistes-shd-001/assisted-readings.json";
import lotExemplesAmicaleGenealogistesShd001PublicAssets from "../../data/generated/batches/lot-exemples-amicale-genealogistes-shd-001/public-assets.json";
import lotHistoireAlgerieFrancaiseTome1001AssistedReadings from "../../data/generated/batches/lot-histoire-algerie-francaise-tome-1-001/assisted-readings.json";
import lotHistoireAlgerieFrancaiseTome1001PublicAssets from "../../data/generated/batches/lot-histoire-algerie-francaise-tome-1-001/public-assets.json";
import lotTitteri1h1216001AssistedReadings from "../../data/generated/batches/lot-titteri-1h1216-001/assisted-readings.json";
import lotTitteri1h1216001PublicAssets from "../../data/generated/batches/lot-titteri-1h1216-001/public-assets.json";
import tiaretZaouiasAssistedReadings from "../../data/generated/batches/lot-tiaret-zaouias-001/assisted-readings.json";
import tiaretZaouiasPublicAssets from "../../data/generated/batches/lot-tiaret-zaouias-001/public-assets.json";
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
  reviewStatus: "assisted_unavailable" | "assisted_unverified" | "image_only";
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

type AssistedReadingManifest =
  | AssistedReadingExample[]
  | {
      readings?: AssistedReadingExample[];
      metadata?: unknown;
    };

const batches = (archiveBatchesManifest as ArchiveBatchesManifest).batches;
const assetManifestRegistry: Record<string, AssetManifest> = {
  "data/generated/batches/lot-fln-w4-001/public-assets.json":
    flnW4PublicAssets as AssetManifest,
  "data/generated/batches/lot-fln-w4-002/public-assets.json":
    flnW4SecondPublicAssets as AssetManifest,
  "data/generated/batches/lot-fln-w4-003/public-assets.json":
    flnW4ThirdPublicAssets as AssetManifest,
  "data/generated/batches/lot-fln-w4-004/public-assets.json":
    flnW4FourthPublicAssets as AssetManifest,
  "data/generated/batches/lot-fln-ralliements-001/public-assets.json":
    flnRalliementsPublicAssets as AssetManifest,
  "data/generated/batches/lot-gouas-zaouias-001/public-assets.json":
    gouasZaouiasPublicAssets as AssetManifest,
  "data/generated/batches/lot-pam-cim-liberes-001/public-assets.json":
    pamCimLiberesPublicAssets as AssetManifest,
  "data/generated/batches/lot-bleuite-fln-w3-amirouche-001/public-assets.json":
    lotBleuiteFlnW3Amirouche001PublicAssets as AssetManifest,
  "data/generated/batches/lot-renseignements-dz-1964-001/public-assets.json":
    lotRenseignementsDz1964001PublicAssets as AssetManifest,
  "data/generated/batches/lot-boghari-visite-fiches-liaison-1959-001/public-assets.json":
    lotBoghariVisiteFichesLiaison1959001PublicAssets as AssetManifest,
  "data/generated/batches/lot-general-durand-1h1239-001/public-assets.json":
    lotGeneralDurand1h1239001PublicAssets as AssetManifest,
  "data/generated/batches/lot-juifs-algeriens-lutte-anticoloniale-001/public-assets.json":
    lotJuifsAlgeriensLutteAnticoloniale001PublicAssets as AssetManifest,
  "data/generated/batches/lot-exemples-amicale-genealogistes-shd-001/public-assets.json":
    lotExemplesAmicaleGenealogistesShd001PublicAssets as AssetManifest,
  "data/generated/batches/lot-histoire-algerie-francaise-tome-1-001/public-assets.json":
    lotHistoireAlgerieFrancaiseTome1001PublicAssets as AssetManifest,
  "data/generated/batches/lot-titteri-1h1216-001/public-assets.json":
    lotTitteri1h1216001PublicAssets as AssetManifest,
  "data/generated/batches/lot-tiaret-zaouias-001/public-assets.json":
    tiaretZaouiasPublicAssets as AssetManifest,
  "data/generated/public-batch-assets.example.json": publicBatchAssets as AssetManifest,
};
const assistedReadingManifestRegistry: Record<string, AssistedReadingManifest> = {
  "data/generated/batches/lot-fln-w4-001/assisted-readings.json":
    flnW4AssistedReadings as AssistedReadingExample[],
  "data/generated/batches/lot-fln-w4-002/assisted-readings.json":
    flnW4SecondAssistedReadings as AssistedReadingExample[],
  "data/generated/batches/lot-fln-w4-003/assisted-readings.json":
    flnW4ThirdAssistedReadings as AssistedReadingExample[],
  "data/generated/batches/lot-fln-ralliements-001/assisted-readings.json":
    flnRalliementsAssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-gouas-zaouias-001/assisted-readings.json":
    gouasZaouiasAssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-pam-cim-liberes-001/assisted-readings.json":
    pamCimLiberesAssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-bleuite-fln-w3-amirouche-001/assisted-readings.json":
    lotBleuiteFlnW3Amirouche001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-renseignements-dz-1964-001/assisted-readings.json":
    lotRenseignementsDz1964001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-boghari-visite-fiches-liaison-1959-001/assisted-readings.json":
    lotBoghariVisiteFichesLiaison1959001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-general-durand-1h1239-001/assisted-readings.json":
    lotGeneralDurand1h1239001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-juifs-algeriens-lutte-anticoloniale-001/assisted-readings.json":
    lotJuifsAlgeriensLutteAnticoloniale001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-exemples-amicale-genealogistes-shd-001/assisted-readings.json":
    lotExemplesAmicaleGenealogistesShd001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-histoire-algerie-francaise-tome-1-001/assisted-readings.json":
    lotHistoireAlgerieFrancaiseTome1001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-titteri-1h1216-001/assisted-readings.json":
    lotTitteri1h1216001AssistedReadings as AssistedReadingManifest,
  "data/generated/batches/lot-tiaret-zaouias-001/assisted-readings.json":
    tiaretZaouiasAssistedReadings as AssistedReadingManifest,
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

  return normalizeArchiveBatchAssets(assetManifestRegistry[batch.assetManifest]?.assets ?? []);
}

export function getAssistedReadingsForBatch(
  batch: ArchiveBatch,
): AssistedReadingExample[] {
  if (!batch.assistedReadingManifest) return [];

  return normalizeAssistedReadingManifest(
    assistedReadingManifestRegistry[batch.assistedReadingManifest],
  );
}

export function getArchiveBatchReviewItems(
  batch: ArchiveBatch,
): ArchiveBatchReviewItem[] {
  const readings = getAssistedReadingsForBatch(batch);

  return getAssetsForBatch(batch).map((asset) => {
    const reading = findReadingForAsset(readings, asset);

    return {
      reviewId: asset.reviewId,
      assetFileName: asset.localJpgFileName,
      publicAssetId: asset.r2ObjectKey,
      reviewStatus: reading?.status ?? "image_only",
      humanValidationStatus: "not_validated",
      confidence: reading?.confidence ?? "low",
      notes: reading?.status === "assisted_unverified"
        ? "Lecture assistee non validee disponible."
        : reading?.status === "assisted_unavailable"
          ? "Lecture assistee non disponible pour cette page."
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
  const asset = getArchiveBatchAssetForReview(batch, reviewItem);

  return (
    findReadingForAsset(
      getAssistedReadingsForBatch(batch),
      asset,
      reviewItem.reviewId,
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
    imageOnlyCount: reviewItems.filter((item) => item.reviewStatus === "image_only").length,
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

function normalizeArchiveBatchAssets(
  assets: RawArchiveBatchAsset[],
): ArchiveBatchAsset[] {
  const inferredReviewIds = assets.map((asset) =>
    asset.reviewId ?? getReviewIdFromFileName(getAssetFileName(asset)),
  );
  const hasDuplicateReviewIds =
    new Set(inferredReviewIds).size !== inferredReviewIds.length;

  return assets.map((asset, index) =>
    normalizeArchiveBatchAsset(
      asset,
      hasDuplicateReviewIds && !asset.reviewId ? getReviewIdFromIndex(index) : undefined,
    ),
  );
}

function normalizeArchiveBatchAsset(
  asset: RawArchiveBatchAsset,
  fallbackReviewId?: string,
): ArchiveBatchAsset {
  const localJpgFileName =
    asset.localJpgFileName ?? getAssetFileName(asset);

  return {
    ...asset,
    localJpgFileName,
    reviewId: asset.reviewId ?? fallbackReviewId ?? getReviewIdFromFileName(localJpgFileName),
  };
}

function findReadingForAsset(
  readings: AssistedReadingExample[],
  asset?: ArchiveBatchAsset,
  fallbackReviewId?: string,
): AssistedReadingExample | undefined {
  if (!asset) {
    return readings.find((reading) => reading.reviewId === fallbackReviewId);
  }

  return readings.find(
    (reading) =>
      getFileNameFromPath(reading.sourceImage ?? "") === asset.localJpgFileName ||
      reading.reviewId === asset.reviewId ||
      reading.reviewId === fallbackReviewId,
  );
}

function normalizeAssistedReadingManifest(
  manifest: AssistedReadingManifest | undefined,
): AssistedReadingExample[] {
  if (!manifest) return [];
  if (Array.isArray(manifest)) return manifest;

  return Array.isArray(manifest.readings) ? manifest.readings : [];
}

function getFileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function getAssetFileName(asset: RawArchiveBatchAsset): string {
  return getFileNameFromPath(asset.localJpgFile ?? asset.r2ObjectKey);
}

function getReviewIdFromFileName(fileName: string): string {
  const match = fileName.match(/^(\d{1,4})[-_]/);
  if (!match) {
    return fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  }

  return `page-${match[1].padStart(2, "0")}`;
}

function getReviewIdFromIndex(index: number): string {
  return `page-${String(index + 1).padStart(2, "0")}`;
}
