import historicalEventsData from "../../data/generated/timeline-historical-events.example.json";
import {
  getArchiveBatches,
  getArchiveBatchReviewItems,
  getAssetsForBatch,
  getAssistedReadingsForBatch,
  isArchiveBatchReviewReady,
  type ArchiveBatch,
} from "@/lib/archiveBatches";

export type TimelineHistoricalEvent = {
  id: string;
  date: string;
  title: string;
  summary: string;
  category: "repere-historique";
  sourceNote: string;
};

export type TimelineDocumentEvent = {
  id: string;
  date: string;
  title: string;
  summary: string;
  lotId: string;
  collectionId: string;
  reviewId: string;
  href: string;
  sourceFileName: string;
  dateEvidence: string;
  reliability: "explicit_date_to_verify";
};

export type UnifiedTimelineEvent =
  | (TimelineHistoricalEvent & { kind: "historical" })
  | (TimelineDocumentEvent & { kind: "document" });

export type ArchiveTimelineData = {
  historicalEvents: TimelineHistoricalEvent[];
  documentEvents: TimelineDocumentEvent[];
  events: UnifiedTimelineEvent[];
  documentLimit: number;
  omittedDocumentCount: number;
};

type HistoricalEventsManifest = TimelineHistoricalEvent[];

const MONTHS: Record<string, string> = {
  aout: "08",
  août: "08",
  avr: "04",
  avril: "04",
  dec: "12",
  decembre: "12",
  décembre: "12",
  fev: "02",
  fevrier: "02",
  février: "02",
  janvier: "01",
  juillet: "07",
  juin: "06",
  mai: "05",
  mars: "03",
  novembre: "11",
  octobre: "10",
  sept: "09",
  septembre: "09",
};

const DEFAULT_DOCUMENT_LIMIT = 12;
const WAR_YEAR_MIN = 1954;
const WAR_YEAR_MAX = 1962;

export function getArchiveTimelineData(
  documentLimit = DEFAULT_DOCUMENT_LIMIT,
): ArchiveTimelineData {
  const historicalEvents = historicalEventsData as HistoricalEventsManifest;
  const allDocumentEvents = getDatedDocumentEventsFromReviewReadyBatches();
  const documentEvents = allDocumentEvents.slice(0, documentLimit);
  const events: UnifiedTimelineEvent[] = [
    ...historicalEvents.map((event) => ({ ...event, kind: "historical" as const })),
    ...documentEvents.map((event) => ({ ...event, kind: "document" as const })),
  ].sort(compareTimelineEvents);

  return {
    documentEvents,
    documentLimit,
    events,
    historicalEvents,
    omittedDocumentCount: Math.max(0, allDocumentEvents.length - documentEvents.length),
  };
}

function getDatedDocumentEventsFromReviewReadyBatches(): TimelineDocumentEvent[] {
  return getArchiveBatches()
    .filter(isArchiveBatchReviewReady)
    .flatMap(getDatedDocumentEventsForBatch)
    .sort(compareTimelineEvents);
}

function getDatedDocumentEventsForBatch(
  batch: ArchiveBatch,
): TimelineDocumentEvent[] {
  const readings = getAssistedReadingsForBatch(batch);
  const reviewItems = getArchiveBatchReviewItems(batch);
  const assets = getAssetsForBatch(batch);

  return readings.flatMap((reading) => {
    if (reading.status !== "assisted_unverified") return [];

    const assistedText = reading.assistedReadingText.trim();
    const dateMatch = extractReliableDocumentDate(assistedText);
    if (!dateMatch || !reading.reviewId) return [];

    const reviewItem = reviewItems.find((item) => item.reviewId === reading.reviewId);
    const asset = assets.find((item) => item.reviewId === reading.reviewId);
    const sourceFileName =
      asset?.localJpgFileName ?? reading.sourceImage ?? reviewItem?.assetFileName;

    if (!sourceFileName) return [];

    return [
      {
        collectionId: batch.collectionId,
        date: dateMatch.date,
        dateEvidence: dateMatch.evidence,
        href: `/lots/${batch.lotId}/${reading.reviewId}`,
        id: `${batch.lotId}-${reading.reviewId}`,
        lotId: batch.lotId,
        reliability: "explicit_date_to_verify",
        reviewId: reading.reviewId,
        sourceFileName,
        summary:
          "Date explicite reperee dans une lecture assistee non validee ; a verifier sur l'image.",
        title: getDocumentTimelineTitle(batch, reading.reviewId, sourceFileName),
      },
    ];
  });
}

function extractReliableDocumentDate(
  text: string,
): { date: string; evidence: string } | null {
  if (!text) return null;

  const compactText = text.replace(/\s+/g, " ").slice(0, 1_500);
  const numericMatch = compactText.match(
    /\b(?:le\s+)?([0-3]?\d)[./-]([01]?\d)[./-]((?:19)?[5-6]\d)\b/i,
  );

  if (numericMatch) {
    return normalizeDateMatch(numericMatch, compactText);
  }

  const monthPattern = Object.keys(MONTHS).join("|");
  const namedMonthMatch = compactText.match(
    new RegExp(`\\b(?:le\\s+)?([0-3]?\\d)\\s+(${monthPattern})\\s+(19[5-6]\\d)\\b`, "i"),
  );

  if (namedMonthMatch) {
    return normalizeDateMatch(namedMonthMatch, compactText);
  }

  return null;
}

function normalizeDateMatch(
  match: RegExpMatchArray,
  text: string,
): { date: string; evidence: string } | null {
  const day = Number.parseInt(match[1], 10);
  const rawMonth = match[2].toLowerCase();
  const rawYear = match[3];
  const month = MONTHS[rawMonth] ?? rawMonth.padStart(2, "0");
  const year = rawYear.length === 2 ? 1900 + Number.parseInt(rawYear, 10) : Number(rawYear);

  if (!isValidTimelineDate(year, Number(month), day)) return null;

  const date = `${year}-${month}-${String(day).padStart(2, "0")}`;
  const evidence = getEvidenceSnippet(text, match.index ?? 0, match[0].length);

  return { date, evidence };
}

function isValidTimelineDate(year: number, month: number, day: number): boolean {
  if (year < WAR_YEAR_MIN || year > WAR_YEAR_MAX) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getEvidenceSnippet(text: string, start: number, length: number): string {
  const before = Math.max(0, start - 42);
  const after = Math.min(text.length, start + length + 42);
  return text.slice(before, after).trim();
}

function getDocumentTimelineTitle(
  batch: ArchiveBatch,
  reviewId: string,
  sourceFileName: string,
): string {
  return `${batch.title} - ${reviewId} (${sourceFileName})`;
}

function compareTimelineEvents(
  a: { date: string; kind?: string },
  b: { date: string; kind?: string },
): number {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;

  return (a.kind ?? "").localeCompare(b.kind ?? "");
}
