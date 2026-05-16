import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type ConfidenceLevel = "low" | "medium" | "high";
type AssistedReadingStatus = "assisted_unverified" | "assisted_unavailable";

interface LocalAssistedReading {
  sourceImage?: string;
  assistedReadingText?: string;
  uncertainties?: AssistedReadingUncertainty[];
  confidence?: ConfidenceLevel;
  status?: string;
  humanValidation?: {
    validated?: boolean;
    validatedBy?: string | null;
    validatedAt?: string | null;
    notes?: string | null;
  };
}

interface AssistedReadingUncertainty {
  fragment: string;
  suggestion: string;
  issue: string;
  confidence: ConfidenceLevel;
  note: string;
}

interface PromotedAssistedReading {
  reviewId: string;
  sourceImage: string;
  assistedReadingText: string;
  uncertainties: AssistedReadingUncertainty[];
  confidence: ConfidenceLevel;
  status: AssistedReadingStatus;
  humanValidation: {
    validated: false;
    validatedBy: null;
    validatedAt: null;
    notes: null;
  };
  note:
    | "Lecture assistee IA non validee ; a verifier sur l'image."
    | "Aucune lecture assistee exploitable produite pour cette page.";
}

const DEFAULT_INPUT_DIRECTORY = ".local/archive-sample/assisted-reading";
const DEFAULT_OUTPUT_PATH = "data/generated/pilot-assisted-readings.example.json";

async function main() {
  const inputDirectory = getArg("--input") ?? DEFAULT_INPUT_DIRECTORY;
  const outputPath = getArg("--out") ?? DEFAULT_OUTPUT_PATH;

  await requireDirectory(inputDirectory);
  const files = await listAssistedReadingFiles(inputDirectory);

  if (files.length === 0) {
    throw new Error(`Aucun fichier *.assisted.json trouve dans ${inputDirectory}.`);
  }

  const promotedReadings = await Promise.all(files.map(promoteFile));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(promotedReadings, null, 2)}\n`,
    "utf8",
  );

  console.log(`Promoted assisted readings written: ${outputPath}`);
  console.log(`Readings: ${promotedReadings.length}`);
}

async function promoteFile(filePath: string): Promise<PromotedAssistedReading> {
  const reading = await readJson<LocalAssistedReading>(filePath);

  const status = normalizeStatus(reading.status);
  const assistedReadingText = getString(reading.assistedReadingText);

  if (status === "assisted_unverified" && assistedReadingText.trim().length === 0) {
    throw new Error(
      `${filePath}: assistedReadingText vide avec status assisted_unverified. Utilisez assisted_unavailable.`,
    );
  }

  if (reading.humanValidation?.validated !== false) {
    throw new Error(`${filePath}: humanValidation.validated doit etre false.`);
  }

  const sourceImage = getSafeSourceImage(reading.sourceImage);

  return {
    reviewId: getReviewId(filePath, sourceImage),
    sourceImage,
    assistedReadingText,
    uncertainties:
      status === "assisted_unavailable"
        ? []
        : normalizeUncertainties(reading.uncertainties ?? []),
    confidence:
      status === "assisted_unavailable"
        ? "low"
        : reading.confidence ?? getOverallConfidence(reading.uncertainties ?? []),
    status,
    humanValidation: {
      validated: false,
      validatedAt: null,
      validatedBy: null,
      notes: null,
    },
    note:
      status === "assisted_unavailable"
        ? "Aucune lecture assistee exploitable produite pour cette page."
        : "Lecture assistee IA non validee ; a verifier sur l'image.",
  };
}

async function requireDirectory(directoryPath: string) {
  if (!existsSync(directoryPath)) {
    throw new Error(`Dossier de lectures assistees absent: ${directoryPath}`);
  }

  const directoryStat = await stat(directoryPath);
  if (!directoryStat.isDirectory()) {
    throw new Error(`Le chemin n'est pas un dossier: ${directoryPath}`);
  }
}

async function listAssistedReadingFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".assisted.json"))
    .map((entry) => path.join(directoryPath, entry.name))
    .sort();
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function getReviewId(filePath: string, sourceImage: string): string {
  const fileNameMatch = path.basename(filePath).match(/page-(\d+)/i);
  if (fileNameMatch) {
    return `page-${fileNameMatch[1].padStart(2, "0")}`;
  }

  const sourceImageMatch = sourceImage.match(/^(\d+)/);
  if (sourceImageMatch) {
    return `page-${sourceImageMatch[1].padStart(2, "0")}`;
  }

  throw new Error(`${filePath}: impossible de deduire reviewId.`);
}

function getSafeSourceImage(value: string | undefined): string {
  const sourceImage = requireString(value, "sourceImage requis.");
  return path.basename(sourceImage);
}

function normalizeUncertainties(
  uncertainties: AssistedReadingUncertainty[],
): AssistedReadingUncertainty[] {
  return uncertainties.map((uncertainty) => ({
    confidence: normalizeConfidence(uncertainty.confidence),
    fragment: uncertainty.fragment ?? "",
    issue: uncertainty.issue ?? "lecture_probable",
    note: uncertainty.note ?? "",
    suggestion: uncertainty.suggestion ?? "",
  }));
}

function getOverallConfidence(
  uncertainties: AssistedReadingUncertainty[],
): ConfidenceLevel {
  if (uncertainties.some((uncertainty) => uncertainty.confidence === "low")) {
    return "low";
  }

  if (uncertainties.some((uncertainty) => uncertainty.confidence === "medium")) {
    return "medium";
  }

  return "high";
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "low";
}

function normalizeStatus(value: unknown): AssistedReadingStatus {
  if (value === "assisted_unverified" || value === "assisted_unavailable") {
    return value;
  }

  if (value === "no_text_detected" || value === "unreadable") {
    return "assisted_unavailable";
  }

  throw new Error(
    `status invalide: ${String(value)}. Utilisez assisted_unverified ou assisted_unavailable.`,
  );
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }

  return value;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
