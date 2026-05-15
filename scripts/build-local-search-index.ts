import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type TextLayer =
  | "ocr_raw"
  | "ocr_clean_mechanical"
  | "assisted_unverified"
  | "validated_transcription";

type ConfidenceLevel = "low" | "medium" | "high";
type ValidationStatus = "unverified" | "assisted_unverified" | "human_validated";

interface LocalSearchIndex {
  generatedAt: string;
  workspace: string;
  examplesDirectory: string;
  entryCount: number;
  warning: string;
  entries: LocalSearchIndexEntry[];
}

interface LocalSearchIndexEntry {
  id: string;
  collectionId: string;
  sourceImage?: string;
  sourceFile?: string;
  textLayer: TextLayer;
  confidence: ConfidenceLevel;
  validationStatus: ValidationStatus;
  text: string;
  sourceTextFile: string;
  uncertaintyCount?: number;
  createdAt: string;
}

interface AssistedReadingExample {
  collectionId?: string;
  confidence?: ConfidenceLevel;
  sourceImage?: string;
  rawOcrTextFile?: string;
  cleanOcrTextFile?: string;
  assistedReadingText?: string;
  assistedReading?: string;
  uncertainties?: unknown[];
  status?: string;
  humanValidation?: {
    validated?: boolean;
  };
}

const DEFAULT_WORKSPACE = ".local/archive-sample";
const DEFAULT_EXAMPLES_DIRECTORY = "data/examples";
const DEFAULT_OUTPUT_PATH = ".local/archive-sample/search/search-index.json";
const DEFAULT_COLLECTION_ID = "shd-1h4382-d1-boghari";

async function main() {
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    throw new Error(
      "Indexation refusee: ajoutez --confirm pour confirmer l'ecriture locale.",
    );
  }

  const workspace = getArg("--workspace") ?? DEFAULT_WORKSPACE;
  const examplesDirectory = getArg("--examples") ?? DEFAULT_EXAMPLES_DIRECTORY;
  const outputPath = getArg("--out") ?? DEFAULT_OUTPUT_PATH;
  const collectionId = getArg("--collection-id") ?? DEFAULT_COLLECTION_ID;

  const generatedAt = new Date().toISOString();
  const entries: LocalSearchIndexEntry[] = [];

  entries.push(
    ...(await buildOcrEntries({
      collectionId,
      createdAt: generatedAt,
      directory: path.join(workspace, "ocr", "raw"),
      textLayer: "ocr_raw",
      sourceImageDirectory: path.join(workspace, "converted"),
    })),
  );

  entries.push(
    ...(await buildOcrEntries({
      collectionId,
      createdAt: generatedAt,
      directory: path.join(workspace, "ocr", "clean"),
      textLayer: "ocr_clean_mechanical",
      sourceImageDirectory: path.join(workspace, "converted"),
    })),
  );

  entries.push(
    ...(await buildAssistedReadingEntries({
      collectionId,
      createdAt: generatedAt,
      examplesDirectory,
    })),
  );

  if (entries.length === 0) {
    throw new Error(
      "Aucune couche textuelle trouvee: verifiez les dossiers OCR ou data/examples.",
    );
  }

  const index: LocalSearchIndex = {
    generatedAt,
    workspace: toPortablePath(workspace),
    examplesDirectory: toPortablePath(examplesDirectory),
    entryCount: entries.length,
    warning:
      "Index local non semantique: aucune validation historique, aucun embedding, aucun appel IA.",
    entries,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  console.log(`Local search index written: ${outputPath}`);
  console.log(`Entries: ${entries.length}`);
}

async function buildOcrEntries(options: {
  collectionId: string;
  createdAt: string;
  directory: string;
  textLayer: Extract<TextLayer, "ocr_raw" | "ocr_clean_mechanical">;
  sourceImageDirectory: string;
}): Promise<LocalSearchIndexEntry[]> {
  const files = await listTextFilesIfDirectoryExists(options.directory);

  return Promise.all(
    files.map(async (filePath) => {
      const text = await readFile(filePath, "utf8");
      const baseName = getTextBaseName(filePath, options.textLayer);
      const sourceImage = path.join(options.sourceImageDirectory, `${baseName}.jpg`);

      return {
        id: createEntryId(options.textLayer, filePath),
        collectionId: options.collectionId,
        sourceImage: toPortablePath(sourceImage),
        sourceFile: toPortablePath(filePath),
        textLayer: options.textLayer,
        confidence: "low",
        validationStatus: "unverified",
        text,
        sourceTextFile: toPortablePath(filePath),
        createdAt: options.createdAt,
      };
    }),
  );
}

async function buildAssistedReadingEntries(options: {
  collectionId: string;
  createdAt: string;
  examplesDirectory: string;
}): Promise<LocalSearchIndexEntry[]> {
  const files = await listJsonFilesIfDirectoryExists(options.examplesDirectory);
  const entries: LocalSearchIndexEntry[] = [];

  for (const filePath of files) {
    const example = await readJson<AssistedReadingExample>(filePath);
    const assistedText = example.assistedReadingText ?? example.assistedReading;

    if (!assistedText) {
      continue;
    }

    const isValidated = example.humanValidation?.validated === true;
    const textLayer: TextLayer = isValidated
      ? "validated_transcription"
      : "assisted_unverified";
    const validationStatus: ValidationStatus = isValidated
      ? "human_validated"
      : "unverified";

    entries.push({
      id: createEntryId(textLayer, filePath),
      collectionId: example.collectionId ?? options.collectionId,
      sourceImage: example.sourceImage ? toPortablePath(example.sourceImage) : undefined,
      sourceFile: toPortablePath(filePath),
      textLayer,
      confidence: getExampleConfidence(example, isValidated),
      validationStatus,
      text: assistedText,
      sourceTextFile: toPortablePath(filePath),
      uncertaintyCount: Array.isArray(example.uncertainties)
        ? example.uncertainties.length
        : 0,
      createdAt: options.createdAt,
    });
  }

  return entries;
}

async function listTextFilesIfDirectoryExists(directoryPath: string): Promise<string[]> {
  if (!(await isDirectory(directoryPath))) {
    console.warn(`Dossier ignore car absent: ${directoryPath}`);
    return [];
  }

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt")
    .map((entry) => path.join(directoryPath, entry.name))
    .sort();
}

async function listJsonFilesIfDirectoryExists(directoryPath: string): Promise<string[]> {
  if (!(await isDirectory(directoryPath))) {
    console.warn(`Dossier ignore car absent: ${directoryPath}`);
    return [];
  }

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".json",
    )
    .map((entry) => path.join(directoryPath, entry.name))
    .sort();
}

async function isDirectory(directoryPath: string): Promise<boolean> {
  if (!existsSync(directoryPath)) {
    return false;
  }

  return (await stat(directoryPath)).isDirectory();
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function getTextBaseName(filePath: string, textLayer: TextLayer): string {
  const baseName = path.basename(filePath, ".txt");
  if (textLayer === "ocr_clean_mechanical" && baseName.endsWith(".clean")) {
    return baseName.slice(0, -".clean".length);
  }

  return baseName;
}

function getExampleConfidence(
  example: AssistedReadingExample,
  isValidated: boolean,
): ConfidenceLevel {
  if (isConfidenceLevel(example.confidence)) {
    return example.confidence;
  }

  return isValidated ? "high" : "medium";
}

function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return value === "low" || value === "medium" || value === "high";
}

function createEntryId(textLayer: TextLayer, filePath: string): string {
  return `${textLayer}:${toPortablePath(filePath)
    .replace(/^[./]+/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
