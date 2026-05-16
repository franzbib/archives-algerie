import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type DetectedLanguage = "fr" | "ar" | "fr+ar" | "other" | "illegible";
export type DetectedScript = "latin" | "arabic" | "other" | "illegible";
export type LanguageDetectionConfidence = "low" | "medium" | "high";

export type PageLanguageDetection = {
  lotId: string;
  reviewId: string;
  sourceFileName: string;
  detectedLanguages: DetectedLanguage[];
  detectedScripts: DetectedScript[];
  confidence: LanguageDetectionConfidence;
  method: "vision_language_detection";
  notes: string;
  humanValidated: false;
};

type LanguageDetectionManifest = {
  lotId: string;
  results: PageLanguageDetection[];
};

const languageDetectionDirectory = path.join(
  process.cwd(),
  "data",
  "generated",
  "language-detection",
);

export function getLanguageDetections(): PageLanguageDetection[] {
  if (!existsSync(languageDetectionDirectory)) return [];

  return readdirSync(languageDetectionDirectory)
    .filter((fileName) => fileName.endsWith(".language.json"))
    .flatMap((fileName) => readLanguageDetectionFile(fileName));
}

export function getLanguageDetectionsForLot(
  lotId: string,
): PageLanguageDetection[] {
  return getLanguageDetections().filter((item) => item.lotId === lotId);
}

export function getLanguageDetectionForPage(
  lotId: string,
  reviewId: string,
): PageLanguageDetection | null {
  return (
    getLanguageDetections().find(
      (item) => item.lotId === lotId && item.reviewId === reviewId,
    ) ?? null
  );
}

export function getLanguageLabel(languages: DetectedLanguage[]): string {
  if (languages.includes("fr+ar") || (languages.includes("fr") && languages.includes("ar"))) {
    return "francais + arabe";
  }
  if (languages.includes("fr")) return "francais";
  if (languages.includes("ar")) return "arabe";
  if (languages.includes("other")) return "autre";
  if (languages.includes("illegible")) return "illisible";

  return "non renseigne";
}

export function getScriptLabel(script: DetectedScript): string {
  if (script === "latin") return "latin";
  if (script === "arabic") return "arabe";
  if (script === "other") return "autre";
  return "illisible";
}

function readLanguageDetectionFile(fileName: string): PageLanguageDetection[] {
  const filePath = path.join(languageDetectionDirectory, fileName);
  const manifest = JSON.parse(readFileSync(filePath, "utf8")) as LanguageDetectionManifest;

  if (!Array.isArray(manifest.results)) return [];

  return manifest.results.filter(isPageLanguageDetection);
}

function isPageLanguageDetection(value: unknown): value is PageLanguageDetection {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return (
    typeof record.lotId === "string" &&
    typeof record.reviewId === "string" &&
    Array.isArray(record.detectedLanguages) &&
    Array.isArray(record.detectedScripts) &&
    (record.confidence === "low" ||
      record.confidence === "medium" ||
      record.confidence === "high") &&
    record.method === "vision_language_detection" &&
    record.humanValidated === false
  );
}
