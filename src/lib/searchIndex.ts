import {
  getArchiveBatches,
  getAssetsForBatch,
  getAssistedReadingsForBatch,
  isArchiveBatchReviewReady,
} from "@/lib/archiveBatches";

export type ArchiveSearchResult = {
  id: string;
  lotId: string;
  reviewId: string;
  lotTitle: string;
  sourceFileName: string;
  href: string;
  excerpt: string;
  matchedFields: string[];
  validationStatus: "assisted_unverified";
};

export type ArchiveSearchDocument = {
  id: string;
  lotId: string;
  reviewId: string;
  lotTitle: string;
  sourceFileName: string;
  href: string;
  assistedReadingText: string;
  validationStatus: "assisted_unverified";
};

const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 25;
const EXCERPT_RADIUS = 120;

export function getArchiveSearchDocuments(): ArchiveSearchDocument[] {
  return getArchiveBatches()
    .filter(isArchiveBatchReviewReady)
    .flatMap((batch) => {
      const assets = getAssetsForBatch(batch);
      const readings = getAssistedReadingsForBatch(batch);

      return readings.flatMap((reading) => {
        if (reading.status !== "assisted_unverified" || !reading.reviewId) {
          return [];
        }

        const asset = assets.find((item) => item.reviewId === reading.reviewId);
        const sourceFileName = asset?.localJpgFileName ?? reading.sourceImage ?? "";

        return [
          {
            assistedReadingText: reading.assistedReadingText,
            href: `/lots/${batch.lotId}/${reading.reviewId}`,
            id: `${batch.lotId}-${reading.reviewId}`,
            lotId: batch.lotId,
            lotTitle: batch.title,
            reviewId: reading.reviewId,
            sourceFileName,
            validationStatus: "assisted_unverified" as const,
          },
        ];
      });
    });
}

export function searchArchiveReadings(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
): ArchiveSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const safeLimit = Math.min(Math.max(1, limit), MAX_SEARCH_LIMIT);
  return searchArchiveDocuments(getArchiveSearchDocuments(), normalizedQuery, safeLimit);
}

export function searchArchiveDocuments(
  documents: ArchiveSearchDocument[],
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
): ArchiveSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const safeLimit = Math.min(Math.max(1, limit), MAX_SEARCH_LIMIT);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const results: ArchiveSearchResult[] = [];

  for (const document of documents) {
    const searchableFields = {
      lotTitle: document.lotTitle,
      reviewId: document.reviewId,
      sourceFileName: document.sourceFileName,
      text: document.assistedReadingText,
    };
    const match = getSearchMatch(searchableFields, tokens, normalizedQuery);

    if (!match) continue;

    results.push({
      excerpt: buildExcerpt(document.assistedReadingText, normalizedQuery),
      href: document.href,
      id: document.id,
      lotId: document.lotId,
      lotTitle: document.lotTitle,
      matchedFields: match,
      reviewId: document.reviewId,
      sourceFileName: document.sourceFileName,
      validationStatus: document.validationStatus,
    });

    if (results.length >= safeLimit) {
      return results;
    }
  }

  return results;
}

function getSearchMatch(
  fields: Record<string, string>,
  tokens: string[],
  normalizedQuery: string,
): string[] | null {
  const matchedFields = Object.entries(fields)
    .filter(([, value]) => {
      const normalizedValue = normalizeSearchText(value);
      if (normalizedValue.includes(normalizedQuery)) return true;

      return tokens.every((token) => normalizedValue.includes(token));
    })
    .map(([key]) => key);

  return matchedFields.length > 0 ? matchedFields : null;
}

function buildExcerpt(text: string, normalizedQuery: string): string {
  if (!text.trim()) return "Lecture assistée vide ou non disponible.";

  const normalizedText = normalizeSearchText(text);
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) {
    return `${text.slice(0, EXCERPT_RADIUS * 2).trim()}${text.length > EXCERPT_RADIUS * 2 ? "..." : ""}`;
  }

  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(text.length, index + normalizedQuery.length + EXCERPT_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
