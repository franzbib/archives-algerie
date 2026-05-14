import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import convert from "heic-convert";

interface DownloadManifest {
  files: DownloadManifestFile[];
}

interface DownloadManifestFile {
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  fileName: string;
  localPath: string;
  mimeType: string;
  sampleNote: string | null;
  sampleOrder: number | null;
  sizeBytes: number;
}

interface ConversionManifest {
  convertedAt: string;
  inputDirectory: string;
  outputDirectory: string;
  downloadManifestPath: string;
  fileCount: number;
  warning: string;
  visualControlChecklist: string[];
  files: ConversionManifestFile[];
}

interface ConversionManifestFile {
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  originalFileName: string;
  sourceHeicPath: string;
  convertedJpgPath: string;
  mimeType: string;
  outputMimeType: "image/jpeg";
  sampleOrder: number | null;
  sampleNote: string | null;
  sourceSizeBytes: number;
  convertedSizeBytes: number;
  conversionNote: string;
}

const DEFAULT_INPUT_DIRECTORY = ".local/archive-sample/raw";
const DEFAULT_OUTPUT_DIRECTORY = ".local/archive-sample/converted";
const DEFAULT_MANIFEST_PATH = ".local/archive-sample/download-manifest.json";

async function main() {
  const inputDirectory = getArg("--input") ?? DEFAULT_INPUT_DIRECTORY;
  const outputDirectory = getArg("--out") ?? DEFAULT_OUTPUT_DIRECTORY;
  const manifestPath = getArg("--manifest") ?? DEFAULT_MANIFEST_PATH;
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    throw new Error(
      "Conversion refusee: ajoutez --confirm pour confirmer l'ecriture locale.",
    );
  }

  await requireDirectory(inputDirectory, "dossier raw");

  if (!existsSync(manifestPath)) {
    throw new Error(`download-manifest.json absent: ${manifestPath}`);
  }

  const rawHeicFiles = await findHeicFiles(inputDirectory);
  if (rawHeicFiles.size === 0) {
    throw new Error(`Aucun fichier HEIC trouve dans ${inputDirectory}.`);
  }

  const downloadManifest = await readJson<DownloadManifest>(manifestPath);
  const manifestFiles = downloadManifest.files.filter(isHeicManifestEntry);
  const filesToConvert = manifestFiles.filter((file) =>
    rawHeicFiles.has(path.basename(file.localPath).toLocaleLowerCase("fr")),
  );

  if (filesToConvert.length === 0) {
    throw new Error(
      "Aucun fichier HEIC du dossier raw ne correspond au download-manifest.json.",
    );
  }

  await mkdir(outputDirectory, { recursive: true });

  const convertedFiles: ConversionManifestFile[] = [];

  for (const file of filesToConvert) {
    const sourcePath = path.join(inputDirectory, path.basename(file.localPath));
    const outputPath = path.join(outputDirectory, toJpgFileName(file.localPath));
    const inputBuffer = await readFile(sourcePath);
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.92,
    });
    const jpgBuffer = Buffer.from(outputBuffer);
    await writeFile(outputPath, jpgBuffer);

    convertedFiles.push({
      collectionId: file.collectionId,
      driveFileId: file.driveFileId,
      driveUrl: file.driveUrl,
      originalFileName: file.fileName,
      sourceHeicPath: sourcePath,
      convertedJpgPath: outputPath,
      mimeType: file.mimeType,
      outputMimeType: "image/jpeg",
      sampleOrder: file.sampleOrder,
      sampleNote: file.sampleNote,
      sourceSizeBytes: file.sizeBytes,
      convertedSizeBytes: jpgBuffer.byteLength,
      conversionNote:
        "Conversion locale HEIC vers JPG pour controle visuel ; aucune OCR, aucune validation documentaire.",
    });

    console.log(`Converted ${sourcePath} -> ${outputPath}`);
  }

  const conversionManifest: ConversionManifest = {
    convertedAt: new Date().toISOString(),
    inputDirectory,
    outputDirectory,
    downloadManifestPath: manifestPath,
    fileCount: convertedFiles.length,
    warning:
      "Conversion technique locale: les JPG ne sont pas des pages ou documents valides.",
    visualControlChecklist: [
      "Lisibilite",
      "Orientation",
      "Doublons",
      "Pages floues",
      "Ordre probable",
      "Debut et fin de document",
    ],
    files: convertedFiles,
  };

  const conversionManifestPath = path.join(
    path.dirname(outputDirectory),
    "conversion-manifest.json",
  );
  await writeFile(
    conversionManifestPath,
    `${JSON.stringify(conversionManifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`Conversion manifest written: ${conversionManifestPath}`);
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

async function findHeicFiles(directoryPath: string): Promise<Set<string>> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isFile() && isHeicFileName(entry.name))
      .map((entry) => entry.name.toLocaleLowerCase("fr")),
  );
}

function isHeicManifestEntry(file: DownloadManifestFile): boolean {
  return (
    file.mimeType.toLocaleLowerCase("fr") === "image/heif" ||
    file.mimeType.toLocaleLowerCase("fr") === "image/heic" ||
    isHeicFileName(file.fileName) ||
    isHeicFileName(file.localPath)
  );
}

function isHeicFileName(fileName: string): boolean {
  const extension = path.extname(fileName).toLocaleLowerCase("fr");
  return extension === ".heic" || extension === ".heif";
}

function toJpgFileName(filePath: string): string {
  return `${path.basename(filePath, path.extname(filePath))}.jpg`;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
