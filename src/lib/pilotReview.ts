import publicPilotAssets from "../../data/generated/public-pilot-assets.example.json";
import pilotReviewIndex from "../../data/generated/pilot-review-index.example.json";
import pilotAssistedReadings from "../../data/generated/pilot-assisted-readings.example.json";

export type PilotReviewStatus =
  | "assisted_unavailable"
  | "assisted_unverified"
  | "image_only";
export type PilotHumanValidationStatus = "not_validated";
export type PilotConfidence = "low" | "medium" | "high";

export type PilotReviewItem = {
  reviewId: string;
  assetFileName: string;
  publicAssetId: string;
  assistedReadingExample: string | null;
  reviewStatus: PilotReviewStatus;
  humanValidationStatus: PilotHumanValidationStatus;
  confidence: PilotConfidence;
  notes: string;
};

export type PublicPilotAsset = {
  collectionId: string;
  originalDriveFileId: string;
  originalDriveUrl: string;
  localJpgFileName: string;
  r2ObjectKey: string;
  publicUrl: string;
  publicationStatus: "image_published_unvalidated";
  validationStatus: "unverified";
  note: string;
};

export type AssistedReadingUncertainty = {
  fragment: string;
  suggestion: string;
  issue: string;
  confidence: PilotConfidence;
  note: string;
};

export type AssistedReadingExample = {
  reviewId?: string;
  sourceImage?: string;
  assistedReadingText: string;
  status: "assisted_unavailable" | "assisted_unverified";
  uncertainties: AssistedReadingUncertainty[];
  confidence?: PilotConfidence;
  humanValidation: {
    validated: boolean;
    validatedBy: string | null;
    validatedAt: string | null;
    notes: string | null;
  };
  note?: string;
};

type PublicPilotAssetsManifest = {
  assets: PublicPilotAsset[];
};

type AssistedReadingManifest =
  | AssistedReadingExample[]
  | {
      readings?: AssistedReadingExample[];
      metadata?: unknown;
    };

const reviewItems = pilotReviewIndex as PilotReviewItem[];
const publicAssets = (publicPilotAssets as PublicPilotAssetsManifest).assets;
const assistedReadings = normalizeAssistedReadingManifest(
  pilotAssistedReadings as AssistedReadingManifest,
);

export function getPilotReviewItems(): PilotReviewItem[] {
  return reviewItems;
}

export function getPilotReviewItemById(id: string): PilotReviewItem | undefined {
  return reviewItems.find((item) => item.reviewId === id);
}

export function getPilotReviewItemByAssetFileName(
  assetFileName: string,
): PilotReviewItem | undefined {
  return reviewItems.find((item) => item.assetFileName === assetFileName);
}

export function getPublicPilotAssetForReview(
  reviewItem: PilotReviewItem,
): PublicPilotAsset | undefined {
  return publicAssets.find(
    (asset) =>
      asset.localJpgFileName === reviewItem.assetFileName ||
      asset.r2ObjectKey === reviewItem.publicAssetId,
  );
}

export function getAssistedReadingForReview(
  reviewItem: PilotReviewItem,
): AssistedReadingExample | null {
  return (
    assistedReadings.find((reading) => reading.reviewId === reviewItem.reviewId) ??
    null
  );
}

function normalizeAssistedReadingManifest(
  manifest: AssistedReadingManifest,
): AssistedReadingExample[] {
  if (Array.isArray(manifest)) return manifest;

  return Array.isArray(manifest.readings) ? manifest.readings : [];
}
