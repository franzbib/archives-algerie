import publicPilotAssets from "../../data/generated/public-pilot-assets.example.json";
import pilotReviewIndex from "../../data/generated/pilot-review-index.example.json";
import assistedReadingPage01 from "../../data/examples/assisted-reading-page-01.example.json";

export type PilotReviewStatus = "assisted_unverified" | "image_only";
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
  assistedReadingText: string;
  status: "assisted_unverified";
  uncertainties: AssistedReadingUncertainty[];
  humanValidation: {
    validated: boolean;
    validatedBy: string | null;
    validatedAt: string | null;
    notes: string | null;
  };
};

type PublicPilotAssetsManifest = {
  assets: PublicPilotAsset[];
};

const reviewItems = pilotReviewIndex as PilotReviewItem[];
const publicAssets = (publicPilotAssets as PublicPilotAssetsManifest).assets;

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
  if (
    reviewItem.assistedReadingExample ===
    "data/examples/assisted-reading-page-01.example.json"
  ) {
    return assistedReadingPage01 as AssistedReadingExample;
  }

  return null;
}
