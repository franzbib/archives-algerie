import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";

type TextLayer =
  | "ocr_raw"
  | "ocr_clean_mechanical"
  | "assisted_unverified"
  | "validated_transcription";

type ConfidenceLevel = "low" | "medium" | "high";
type ValidationStatus = "unverified" | "assisted_unverified" | "human_validated";

interface LocalSearchIndex {
  generatedAt?: string;
  entryCount?: number;
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

interface SearchResult {
  rank: number;
  id: string;
  excerpt: string;
  textLayer: TextLayer;
  confidence: ConfidenceLevel;
  validationStatus: ValidationStatus;
  sourceImage?: string;
  sourceTextFile: string;
  collectionId: string;
  warning?: string;
}

const DEFAULT_INDEX_PATH = ".local/archive-sample/search/search-index.json";
const DEFAULT_LIMIT = 10;
const EXCERPT_LENGTH = 200;

async function main() {
  const query = getRequiredArg("--query");
  const indexPath = getArg("--index") ?? DEFAULT_INDEX_PATH;
  const layer = getOptionalTextLayer("--layer");
  const confidence = getOptionalConfidence("--confidence");
  const limit = getLimit();
  const jsonOutput = process.argv.includes("--json");

  await requireFile(indexPath, "index local de recherche");

  const index = await readJson<LocalSearchIndex>(indexPath);
  const results = searchEntries(index.entries, {
    confidence,
    layer,
    limit,
    query,
  });

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          query,
          indexPath,
          layer: layer ?? null,
          confidence: confidence ?? null,
          resultCount: results.length,
          results,
        },
        null,
        2,
      ),
    );
    return;
  }

  printHumanResults(results, {
    confidence,
    indexPath,
    layer,
    query,
  });
}

function searchEntries(
  entries: LocalSearchIndexEntry[],
  options: {
    confidence?: ConfidenceLevel;
    layer?: TextLayer;
    limit: number;
    query: string;
  },
): SearchResult[] {
  const normalizedQuery = normalizeForSearch(options.query);
  const results: SearchResult[] = [];

  for (const entry of entries) {
    if (options.layer && entry.textLayer !== options.layer) {
      continue;
    }

    if (options.confidence && entry.confidence !== options.confidence) {
      continue;
    }

    const normalizedText = normalizeForSearch(entry.text);
    const matchIndex = normalizedText.indexOf(normalizedQuery);

    if (matchIndex < 0) {
      continue;
    }

    results.push({
      rank: results.length + 1,
      id: entry.id,
      excerpt: buildExcerpt(entry.text, matchIndex, options.query.length),
      textLayer: entry.textLayer,
      confidence: entry.confidence,
      validationStatus: entry.validationStatus,
      sourceImage: entry.sourceImage,
      sourceTextFile: entry.sourceTextFile,
      collectionId: entry.collectionId,
      warning:
        entry.confidence === "low"
          ? "Resultat a faible confiance : verifier sur l'image."
          : undefined,
    });

    if (results.length >= options.limit) {
      break;
    }
  }

  return results;
}

function printHumanResults(
  results: SearchResult[],
  options: {
    confidence?: ConfidenceLevel;
    indexPath: string;
    layer?: TextLayer;
    query: string;
  },
) {
  console.log(`Recherche locale dans l'index: ${options.indexPath}`);
  console.log(`Requete: "${options.query}"`);

  if (options.layer) {
    console.log(`Couche filtree: ${options.layer}`);
  }

  if (options.confidence) {
    console.log(`Confiance filtree: ${options.confidence}`);
  }

  if (results.length === 0) {
    console.log("Aucun resultat ne correspond a cette recherche.");
    return;
  }

  console.log(`Resultats: ${results.length}`);

  for (const result of results) {
    console.log("");
    console.log(`#${result.rank}`);
    console.log(`Extrait: ${result.excerpt}`);
    console.log(`Couche: ${result.textLayer}`);
    console.log(`Confiance: ${result.confidence}`);
    console.log(`Validation: ${result.validationStatus}`);
    console.log(`Collection: ${result.collectionId}`);
    console.log(`Image source: ${result.sourceImage ?? "Non renseignee"}`);
    console.log(`Texte source: ${result.sourceTextFile}`);

    if (result.warning) {
      console.log(result.warning);
    }
  }
}

function buildExcerpt(text: string, matchIndex: number, queryLength: number): string {
  const sideLength = Math.max(0, Math.floor((EXCERPT_LENGTH - queryLength) / 2));
  const start = Math.max(0, matchIndex - sideLength);
  const end = Math.min(text.length, matchIndex + queryLength + sideLength);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${text.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

async function requireFile(filePath: string, label: string) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} introuvable: ${filePath}`);
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error(`${label} n'est pas un fichier: ${filePath}`);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
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

function getOptionalTextLayer(name: string): TextLayer | undefined {
  const value = getArg(name);
  if (!value) {
    return undefined;
  }

  if (isTextLayer(value)) {
    return value;
  }

  throw new Error(
    `${name} invalide: utilisez ocr_raw, ocr_clean_mechanical, assisted_unverified ou validated_transcription.`,
  );
}

function getOptionalConfidence(name: string): ConfidenceLevel | undefined {
  const value = getArg(name);
  if (!value) {
    return undefined;
  }

  if (isConfidenceLevel(value)) {
    return value;
  }

  throw new Error(`${name} invalide: utilisez low, medium ou high.`);
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

function isTextLayer(value: string): value is TextLayer {
  return (
    value === "ocr_raw" ||
    value === "ocr_clean_mechanical" ||
    value === "assisted_unverified" ||
    value === "validated_transcription"
  );
}

function isConfidenceLevel(value: string): value is ConfidenceLevel {
  return value === "low" || value === "medium" || value === "high";
}

function normalizeForSearch(value: string): string {
  return value.toLocaleLowerCase("fr-FR");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
