import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

interface NormalizationManifest {
  generatedAt: string;
  inputDirectory: string;
  outputDirectory: string;
  fileCount: number;
  warning: string;
  files: NormalizationManifestItem[];
}

interface NormalizationManifestItem {
  sourceRawTextFile: string;
  outputCleanTextFile: string;
  rawCharacterCount: number;
  cleanCharacterCount: number;
  status: "ocr_clean_mechanical";
  note: "Nettoyage mécanique uniquement ; texte non relu.";
}

const DEFAULT_INPUT_DIRECTORY = ".local/archive-sample/ocr/raw";
const DEFAULT_OUTPUT_DIRECTORY = ".local/archive-sample/ocr/clean";

async function main() {
  const inputDirectory = getArg("--input") ?? DEFAULT_INPUT_DIRECTORY;
  const outputDirectory = getArg("--out") ?? DEFAULT_OUTPUT_DIRECTORY;
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    throw new Error(
      "Normalisation refusee: ajoutez --confirm pour confirmer l'ecriture locale.",
    );
  }

  await requireDirectory(inputDirectory, "dossier OCR raw");

  const textFiles = await listTextFiles(inputDirectory);
  if (textFiles.length === 0) {
    throw new Error(`Aucun fichier .txt trouve dans ${inputDirectory}.`);
  }

  await mkdir(outputDirectory, { recursive: true });

  const files: NormalizationManifestItem[] = [];

  for (const sourceRawTextFile of textFiles) {
    const rawText = await readFile(sourceRawTextFile, "utf8");
    const cleanText = normalizeOcrText(rawText);
    const outputCleanTextFile = path.join(
      outputDirectory,
      `${path.basename(sourceRawTextFile, ".txt")}.clean.txt`,
    );

    await writeFile(outputCleanTextFile, cleanText, "utf8");

    files.push({
      sourceRawTextFile,
      outputCleanTextFile,
      rawCharacterCount: rawText.length,
      cleanCharacterCount: cleanText.length,
      status: "ocr_clean_mechanical",
      note: "Nettoyage mécanique uniquement ; texte non relu.",
    });

    console.log(`Normalized ${sourceRawTextFile} -> ${outputCleanTextFile}`);
  }

  const manifest: NormalizationManifest = {
    generatedAt: new Date().toISOString(),
    inputDirectory,
    outputDirectory,
    fileCount: files.length,
    warning:
      "Normalisation mecanique uniquement: aucune correction interpretative, aucune validation de transcription.",
    files,
  };

  const manifestPath = path.join(
    path.dirname(outputDirectory),
    "normalization-manifest.json",
  );
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Normalization manifest written: ${manifestPath}`);
}

async function requireDirectory(directoryPath: string, label: string) {
  if (!existsSync(directoryPath)) {
    throw new Error(`${label} absent: ${directoryPath}`);
  }

  const directoryStat = await stat(directoryPath);
  if (!directoryStat.isDirectory()) {
    throw new Error(`${label} n'est pas un dossier: ${directoryPath}`);
  }
}

async function listTextFiles(inputDirectory: string): Promise<string[]> {
  const entries = await readdir(inputDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt")
    .map((entry) => path.join(inputDirectory, entry.name))
    .sort();
}

function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
