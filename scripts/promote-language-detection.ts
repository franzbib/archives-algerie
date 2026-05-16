import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type DetectedLanguage = "fr" | "ar" | "fr+ar" | "other" | "illegible";
type DetectedScript = "latin" | "arabic" | "other" | "illegible";
type ConfidenceLevel = "low" | "medium" | "high";

type LanguageDetectionEntry = {
  lotId: string;
  reviewId: string;
  sourceFileName: string;
  detectedLanguages: DetectedLanguage[];
  detectedScripts: DetectedScript[];
  confidence: ConfidenceLevel;
  method: "vision_language_detection";
  notes: string;
  humanValidated: false;
};

type LanguageDetectionManifest = {
  generatedAt: string;
  lotId: string;
  results: LanguageDetectionEntry[];
};

const allowedLanguages: DetectedLanguage[] = ["fr", "ar", "fr+ar", "other", "illegible"];
const allowedScripts: DetectedScript[] = ["latin", "arabic", "other", "illegible"];
const allowedConfidences: ConfidenceLevel[] = ["low", "medium", "high"];

async function main() {
  const inputPath = getRequiredArg("--input");
  const outputPath = getArg("--out");

  if (!existsSync(inputPath)) {
    throw new Error(`Fichier de detection introuvable: ${inputPath}`);
  }

  const input = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
  const promoted = normalizeManifest(input);
  const targetPath =
    outputPath ??
    path.join(
      "data",
      "generated",
      "language-detection",
      `${promoted.lotId}.language.json`,
    );

  assertOutputPathAllowed(targetPath, promoted.lotId);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(promoted, null, 2)}\n`, "utf8");
  console.log(`Language detection promoted: ${targetPath}`);
}

function normalizeManifest(value: unknown): LanguageDetectionManifest {
  const record = asRecord(value);
  const lotId = getRequiredString(record.lotId, "lotId");
  const rawResults = Array.isArray(record.results) ? record.results : [];

  if (rawResults.length === 0) {
    throw new Error("Aucune entree de detection linguistique a promouvoir.");
  }

  const results = rawResults.map((entry, index) => normalizeEntry(entry, lotId, index));

  return {
    generatedAt: new Date().toISOString(),
    lotId,
    results,
  };
}

function normalizeEntry(
  value: unknown,
  expectedLotId: string,
  index: number,
): LanguageDetectionEntry {
  const record = asRecord(value);
  const lotId = getRequiredString(record.lotId, `results[${index}].lotId`);
  const reviewId = getRequiredString(record.reviewId, `results[${index}].reviewId`);

  if (lotId !== expectedLotId) {
    throw new Error(
      `Lot incoherent pour ${reviewId}: ${lotId} au lieu de ${expectedLotId}.`,
    );
  }

  return {
    lotId,
    reviewId,
    sourceFileName: getRequiredString(
      record.sourceFileName,
      `results[${index}].sourceFileName`,
    ),
    detectedLanguages: normalizeAllowedArray(
      record.detectedLanguages,
      allowedLanguages,
      `results[${index}].detectedLanguages`,
    ),
    detectedScripts: normalizeAllowedArray(
      record.detectedScripts,
      allowedScripts,
      `results[${index}].detectedScripts`,
    ),
    confidence: normalizeAllowedValue(
      record.confidence,
      allowedConfidences,
      `results[${index}].confidence`,
    ),
    method: "vision_language_detection",
    notes: getString(record.notes),
    humanValidated: false,
  };
}

function normalizeAllowedArray<T extends string>(
  value: unknown,
  allowed: T[],
  label: string,
): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} doit etre un tableau non vide.`);
  }

  return value.map((item) => normalizeAllowedValue(item, allowed, label));
}

function normalizeAllowedValue<T extends string>(
  value: unknown,
  allowed: T[],
  label: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} contient une valeur inconnue: ${String(value)}`);
  }

  return value as T;
}

function assertOutputPathAllowed(outputPath: string, lotId: string) {
  const expected = toPortablePath(
    path.join("data", "generated", "language-detection", `${lotId}.language.json`),
  );
  const actual = toPortablePath(outputPath);

  if (actual !== expected) {
    throw new Error(`Sortie refusee: utilisez ${expected}.`);
  }
}

function getRequiredArg(name: string): string {
  const value = getArg(name);
  if (!value) {
    throw new Error(`${name} est requis.`);
  }

  return value;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} est requis.`);
  }

  return value;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
