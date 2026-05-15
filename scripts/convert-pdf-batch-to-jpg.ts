import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

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

interface PdfConversionManifest {
  convertedAt: string;
  inputDirectory: string;
  outputDirectory: string;
  downloadManifestPath: string;
  converter: "imagemagick" | "poppler";
  fileCount: number;
  pageImageCount: number;
  warning: string;
  files: PdfConversionManifestFile[];
}

interface PdfConversionManifestFile {
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  originalFileName: string;
  sourcePdfPath: string;
  convertedJpgPaths: string[];
  mimeType: "application/pdf";
  outputMimeType: "image/jpeg";
  sampleOrder: number | null;
  sampleNote: string | null;
  sourceSizeBytes: number;
  conversionNote: string;
}

const DEFAULT_INPUT_DIRECTORY = ".local/archive-batches/lot-frontiere-maroc-001/raw";
const DEFAULT_OUTPUT_DIRECTORY =
  ".local/archive-batches/lot-frontiere-maroc-001/converted";
const DEFAULT_MANIFEST_PATH =
  ".local/archive-batches/lot-frontiere-maroc-001/download-manifest.json";
const DEFAULT_DPI = 300;

async function main() {
  if (!process.argv.includes("--confirm")) {
    throw new Error(
      "Conversion PDF refusee: ajoutez --confirm pour confirmer l'ecriture locale.",
    );
  }

  const inputDirectory = getArg("--input") ?? DEFAULT_INPUT_DIRECTORY;
  const outputDirectory = getArg("--out") ?? DEFAULT_OUTPUT_DIRECTORY;
  const manifestPath = getArg("--manifest") ?? DEFAULT_MANIFEST_PATH;
  const limit = getLimit();
  const dpi = getDpi();

  await requireDirectory(inputDirectory, "dossier raw PDF");
  if (!existsSync(manifestPath)) {
    throw new Error(`download-manifest.json absent: ${manifestPath}`);
  }

  const downloadManifest = await readJson<DownloadManifest>(manifestPath);
  const pdfCandidates = downloadManifest.files
    .filter(isPdfManifestEntry)
    .filter((file) => existsSync(resolveLocalPath(inputDirectory, file.localPath)))
    .slice(0, limit);

  if (pdfCandidates.length === 0) {
    throw new Error(
      `Aucun PDF du download-manifest.json ne correspond au dossier ${inputDirectory}.`,
    );
  }

  const converter = await detectPdfConverter();
  await mkdir(outputDirectory, { recursive: true });

  const convertedFiles: PdfConversionManifestFile[] = [];

  for (const file of pdfCandidates) {
    const sourcePdfPath = resolveLocalPath(inputDirectory, file.localPath);
    const outputPrefix = path.join(
      outputDirectory,
      path.basename(sourcePdfPath, path.extname(sourcePdfPath)),
    );
    const convertedJpgPaths =
      converter === "poppler"
        ? await convertWithPoppler(sourcePdfPath, outputPrefix, dpi)
        : await convertWithImageMagick(sourcePdfPath, outputPrefix, dpi);
    const sourceStat = await stat(sourcePdfPath);

    convertedFiles.push({
      collectionId: file.collectionId,
      driveFileId: file.driveFileId,
      driveUrl: file.driveUrl,
      originalFileName: file.fileName,
      sourcePdfPath,
      convertedJpgPaths,
      mimeType: "application/pdf",
      outputMimeType: "image/jpeg",
      sampleOrder: file.sampleOrder,
      sampleNote: file.sampleNote,
      sourceSizeBytes: sourceStat.size,
      conversionNote:
        "Conversion locale PDF vers JPG pour controle visuel ; aucun OCR, aucune validation documentaire.",
    });

    console.log(
      `Converted PDF ${sourcePdfPath} -> ${convertedJpgPaths.length} JPG page(s)`,
    );
  }

  const conversionManifest: PdfConversionManifest = {
    convertedAt: new Date().toISOString(),
    inputDirectory,
    outputDirectory,
    downloadManifestPath: manifestPath,
    converter,
    fileCount: convertedFiles.length,
    pageImageCount: convertedFiles.reduce(
      (total, file) => total + file.convertedJpgPaths.length,
      0,
    ),
    warning:
      "Conversion technique locale: les JPG issus de PDF ne sont pas des pages ou documents valides.",
    files: convertedFiles,
  };

  const outputManifestPath = path.join(
    path.dirname(outputDirectory),
    "pdf-conversion-manifest.json",
  );
  await writeFile(
    outputManifestPath,
    `${JSON.stringify(conversionManifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`PDF conversion manifest written: ${outputManifestPath}`);
}

async function detectPdfConverter(): Promise<"imagemagick" | "poppler"> {
  if (await commandAvailable("pdftoppm", ["-v"])) {
    return "poppler";
  }

  if (await commandAvailable("magick", ["-version"])) {
    return "imagemagick";
  }

  throw new Error(
    "Aucun convertisseur PDF disponible. Installez Poppler (`pdftoppm`) ou ImageMagick (`magick`) avant de convertir les PDF.",
  );
}

async function convertWithPoppler(
  sourcePdfPath: string,
  outputPrefix: string,
  dpi: number,
): Promise<string[]> {
  const before = await listJpgFiles(path.dirname(outputPrefix));
  await runCommand("pdftoppm", [
    "-jpeg",
    "-r",
    String(dpi),
    sourcePdfPath,
    outputPrefix,
  ]);
  const after = await listJpgFiles(path.dirname(outputPrefix));
  return diffFiles(before, after);
}

async function convertWithImageMagick(
  sourcePdfPath: string,
  outputPrefix: string,
  dpi: number,
): Promise<string[]> {
  const before = await listJpgFiles(path.dirname(outputPrefix));
  await runCommand("magick", [
    "-density",
    String(dpi),
    sourcePdfPath,
    "-quality",
    "92",
    `${outputPrefix}-%03d.jpg`,
  ]);
  const after = await listJpgFiles(path.dirname(outputPrefix));
  return diffFiles(before, after);
}

function commandAvailable(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      stdio: "ignore",
      windowsHide: true,
    });

    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0 || code === 1));
  });
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      stdio: "pipe",
      windowsHide: false,
    });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

async function listJpgFiles(directoryPath: string): Promise<Set<string>> {
  if (!existsSync(directoryPath)) {
    return new Set();
  }

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isFile() && isJpgFileName(entry.name))
      .map((entry) => path.join(directoryPath, entry.name)),
  );
}

function diffFiles(before: Set<string>, after: Set<string>): string[] {
  return [...after].filter((filePath) => !before.has(filePath)).sort();
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

function resolveLocalPath(inputDirectory: string, localPath: string): string {
  return path.join(inputDirectory, path.basename(localPath));
}

function isPdfManifestEntry(file: DownloadManifestFile): boolean {
  return (
    file.mimeType.toLocaleLowerCase("fr") === "application/pdf" ||
    path.extname(file.fileName).toLocaleLowerCase("fr") === ".pdf" ||
    path.extname(file.localPath).toLocaleLowerCase("fr") === ".pdf"
  );
}

function isJpgFileName(fileName: string): boolean {
  const extension = path.extname(fileName).toLocaleLowerCase("fr");
  return extension === ".jpg" || extension === ".jpeg";
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return 100;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

function getDpi(): number {
  const rawDpi = getArg("--dpi");
  if (!rawDpi) {
    return DEFAULT_DPI;
  }

  const parsed = Number.parseInt(rawDpi, 10);
  if (!Number.isFinite(parsed) || parsed < 72) {
    throw new Error("--dpi doit etre un entier superieur ou egal a 72.");
  }

  return parsed;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
