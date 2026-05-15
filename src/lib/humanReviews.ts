import boghariHumanReviews from "../../data/generated/human-reviews/lot-boghari-001.example.json";
import flnW4HumanReviews from "../../data/generated/human-reviews/lot-fln-w4-001.example.json";

export type HumanReviewStatus =
  | "not_reviewed"
  | "in_review"
  | "correction_proposed"
  | "partially_validated"
  | "validated"
  | "needs_image_check"
  | "unreadable";

export type HumanReviewNote = {
  lotId: string;
  reviewId: string;
  status: HumanReviewStatus;
  proposedTranscription: string | null;
  notes: string | null;
  properNamesNotes: string | null;
  placesNotes: string | null;
  datesNotes: string | null;
  acronymsNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  validated: boolean;
};

type HumanReviewManifest = {
  generatedAt: string;
  schema: "human-review-notes-v1";
  lotId: string;
  warning: string;
  reviews: HumanReviewNote[];
};

const humanReviewManifestRegistry: Record<string, HumanReviewManifest> = {
  "lot-boghari-001": boghariHumanReviews as HumanReviewManifest,
  "lot-fln-w4-001": flnW4HumanReviews as HumanReviewManifest,
};

export function getHumanReviewNote(
  lotId: string,
  reviewId: string,
): HumanReviewNote | null {
  return (
    humanReviewManifestRegistry[lotId]?.reviews.find(
      (review) => review.reviewId === reviewId,
    ) ?? null
  );
}

export function getHumanReviewStatusLabel(status: HumanReviewStatus): string {
  const labels: Record<HumanReviewStatus, string> = {
    not_reviewed: "Non relu",
    in_review: "Relecture en cours",
    correction_proposed: "Correction proposee",
    partially_validated: "Relu partiellement",
    validated: "Transcription validee",
    needs_image_check: "A verifier sur image",
    unreadable: "Image ou texte inexploitable",
  };

  return labels[status];
}
