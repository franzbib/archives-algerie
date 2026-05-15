import publicBatchAssets from "../../data/generated/public-batch-assets.example.json";
import batchAssistedReadings from "../../data/generated/pilot-batch-assisted-readings.example.json";
import type {
  AssistedReadingExample,
  AssistedReadingUncertainty,
  PilotConfidence,
} from "@/lib/pilotReview";

export type BatchReviewStatus = "assisted_unverified" | "image_only";
export type BatchHumanValidationStatus = "not_validated";

export type PublicBatchAsset = {
  collectionId: string;
  originalDriveFileId: string;
  originalDriveUrl: string;
  localJpgFileName: string;
  r2ObjectKey: string;
  publicUrl: string;
  publicationStatus: "image_published_unvalidated";
  validationStatus: "unverified";
  reviewId: string;
  note: string;
};

export type BatchReviewItem = {
  reviewId: string;
  assetFileName: string;
  publicAssetId: string;
  reviewStatus: BatchReviewStatus;
  humanValidationStatus: BatchHumanValidationStatus;
  confidence: PilotConfidence;
  notes: string;
};

type PublicBatchAssetsManifest = {
  assetCount: number;
  collectionId: string;
  warning: string;
  assets: PublicBatchAsset[];
};

const publicAssetsManifest = publicBatchAssets as PublicBatchAssetsManifest;
const publicAssets = publicAssetsManifest.assets;
const assistedReadings = batchAssistedReadings as AssistedReadingExample[];

export type { AssistedReadingExample, AssistedReadingUncertainty, PilotConfidence };

export function getBatchReviewItems(): BatchReviewItem[] {
  return publicAssets.map((asset) => {
    const reading = getAssistedReadingByReviewId(asset.reviewId);

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

export function getBatchReviewItemById(id: string): BatchReviewItem | undefined {
  return getBatchReviewItems().find((item) => item.reviewId === id);
}

export function getBatchReviewItemByAssetFileName(
  assetFileName: string,
): BatchReviewItem | undefined {
  return getBatchReviewItems().find((item) => item.assetFileName === assetFileName);
}

export function getPublicBatchAssetForReview(
  reviewItem: BatchReviewItem,
): PublicBatchAsset | undefined {
  return publicAssets.find(
    (asset) =>
      asset.reviewId === reviewItem.reviewId ||
      asset.localJpgFileName === reviewItem.assetFileName ||
      asset.r2ObjectKey === reviewItem.publicAssetId,
  );
}

export function getAssistedReadingForBatchReview(
  reviewItem: BatchReviewItem,
): AssistedReadingExample | null {
  return getAssistedReadingByReviewId(reviewItem.reviewId);
}

export function getPublicBatchAssets(): PublicBatchAsset[] {
  return publicAssets;
}

export function getBatchReviewSummary() {
  const reviewItems = getBatchReviewItems();
  const assistedReadingCount = reviewItems.filter(
    (item) => item.reviewStatus === "assisted_unverified",
  ).length;

  return {
    assetCount: publicAssetsManifest.assetCount,
    assistedReadingCount,
    collectionId: publicAssetsManifest.collectionId,
    imageOnlyCount: reviewItems.length - assistedReadingCount,
    warning: publicAssetsManifest.warning,
  };
}

function getAssistedReadingByReviewId(
  reviewId: string,
): AssistedReadingExample | null {
  return assistedReadings.find((reading) => reading.reviewId === reviewId) ?? null;
}
