import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applyDriveAuth,
  describeDriveAuth,
  type DriveAuth,
  getRequiredDriveAuth,
} from "./drive-auth";

interface DriveInventory {
  generatedAt?: string;
  mode?: string;
  sources: DriveInventorySource[];
}

interface DriveInventorySource {
  collectionId: string;
  title: string;
  driveFolderUrl: string;
  files: DriveInventoryFile[];
}

interface DriveInventoryFile {
  conversionNeeded?: boolean;
  conversionTarget?: "jpg" | "pdf" | "png" | null;
  driveFileId: string;
  driveUrl: string;
  fileKind?: "image" | "pdf" | "unknown";
  fileName: string;
  mimeType: string;
  preparationStatus?: string;
  sampleCandidate?: boolean;
  sampleNote?: string | null;
  sampleOrder?: number | null;
}

type DownloadMode = "sample" | "batch";

interface DownloadCandidate {
  batchOrder: number;
  file: DriveInventoryFile;
  source: DriveInventorySource;
}

interface DownloadManifest {
  downloadedAt: string;
  inventoryPath: string;
  lotId: string;
  outputDirectory: string;
  mode: DownloadMode;
  limit: number;
  fileCount: number;
  warning: string;
  files: DownloadManifestFile[];
}

interface DownloadManifestFile {
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  fileName: string;
  localPath: string;
  mimeType: string;
  batchOrder: number;
  selectionMode: DownloadMode;
  sampleNote: string | null;
  sampleOrder: number | null;
  sizeBytes: number;
}

interface DownloadErrorReport {
  generatedAt: string;
  inventoryPath: string;
  lotId: string;
  outputDirectory: string;
  reportType: "download-errors";
  note: string;
  skippedFiles: DownloadSkippedFile[];
}

interface DownloadSkippedFile {
  batchOrder: number;
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  fileName: string;
  failedAt: string;
  httpStatus: number;
  reason: string;
  status: "skipped_download_403" | "skipped_download_429";
}

class SkippableDriveDownloadError extends Error {
  constructor(message: string, readonly httpStatus: number) {
    super(message);
  }
}

async function main() {
  const inventoryPath =
    getArg("--inventory") ?? "data/generated/drive-inventory.pilot.json";
  const outputDirectory = getArg("--out") ?? ".local/archive-sample/raw";
  const lotId = getArg("--lot-id") ?? "pilot-sample";
  const mode = getMode();
  const limit = getLimit(mode);
  const confirmed = process.argv.includes("--confirm");
  const driveAuth = await getRequiredDriveAuth("Le telechargement Drive");

  if (!confirmed) {
    throw new Error(
      "Telechargement refuse: ajoutez --confirm pour confirmer l'ecriture locale.",
    );
  }

  const inventory = await readJson<DriveInventory>(inventoryPath);
  const candidates = getDownloadCandidates(inventory, mode).slice(0, limit);
  console.log(`Authentification Drive: ${describeDriveAuth(driveAuth)}`);

  if (candidates.length === 0) {
    throw new Error(
      mode === "sample"
        ? "Aucun fichier sampleCandidate: true trouve dans l'inventaire."
        : "Aucun fichier trouve dans l'inventaire pour le lot complet.",
    );
  }

  await mkdir(outputDirectory, { recursive: true });

  const manifestFiles: DownloadManifestFile[] = [];
  const skippedFiles: DownloadSkippedFile[] = [];
  const usedNames = new Set<string>();

  for (const candidate of candidates) {
    const fileName = getUniqueFileName(
      formatDownloadFileName(candidate),
      usedNames,
    );
    const localPath = path.join(outputDirectory, fileName);
    let bytes: Buffer;

    try {
      bytes = await downloadDriveFile(candidate.file.driveFileId, driveAuth);
    } catch (error) {
      if (!(error instanceof SkippableDriveDownloadError)) {
        throw error;
      }

      skippedFiles.push({
        batchOrder: candidate.batchOrder,
        collectionId: candidate.source.collectionId,
        driveFileId: candidate.file.driveFileId,
        driveUrl: candidate.file.driveUrl,
        failedAt: new Date().toISOString(),
        fileName: candidate.file.fileName,
        httpStatus: error.httpStatus,
        reason: error.message,
        status:
          error.httpStatus === 429
            ? "skipped_download_429"
            : "skipped_download_403",
      });
      console.warn(
        `[DOWNLOAD WARNING] ${candidate.file.fileName}: ${error.message}. Fichier ignore, aucune image ni contenu invente.`,
      );
      continue;
    }

    await writeFile(localPath, bytes);

    manifestFiles.push({
      collectionId: candidate.source.collectionId,
      driveFileId: candidate.file.driveFileId,
      driveUrl: candidate.file.driveUrl,
      fileName: candidate.file.fileName,
      localPath,
      mimeType: candidate.file.mimeType,
      batchOrder: candidate.batchOrder,
      selectionMode: mode,
      sampleNote: candidate.file.sampleNote ?? null,
      sampleOrder: candidate.file.sampleOrder ?? null,
      sizeBytes: bytes.byteLength,
    });

    console.log(`Downloaded ${candidate.file.fileName} -> ${localPath}`);
  }

  const manifest: DownloadManifest = {
    downloadedAt: new Date().toISOString(),
    inventoryPath,
    lotId,
    outputDirectory,
    mode,
    limit,
    fileCount: manifestFiles.length,
    warning:
      mode === "sample"
        ? "Telechargement brut de l'echantillon pilote: aucune conversion, aucun OCR, aucune notice validee."
        : "Telechargement brut du lot pilote complet: aucune conversion, aucun OCR, aucune notice validee.",
    files: manifestFiles,
  };

  const manifestPath = path.join(
    path.dirname(outputDirectory),
    "download-manifest.json",
  );
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Download manifest written: ${manifestPath}`);

  if (skippedFiles.length > 0) {
    const reportPath = path.join(
      path.dirname(outputDirectory),
      "reports",
      "download-errors.json",
    );
    await writeDownloadErrorReport({
      inventoryPath,
      lotId,
      outputDirectory,
      reportPath,
      skippedFiles,
    });
    console.warn(
      `[DOWNLOAD WARNING] ${skippedFiles.length} fichier(s) ignores. Rapport local: ${reportPath}`,
    );
  }

  if (manifestFiles.length === 0) {
    throw new Error(
      "Aucun fichier n'a ete telecharge. Consultez le rapport local de telechargement avant de reprendre le lot.",
    );
  }
}

function getDownloadCandidates(
  inventory: DriveInventory,
  mode: DownloadMode,
): DownloadCandidate[] {
  const candidates = inventory.sources.flatMap((source) =>
    source.files.map((file, index) => ({
      batchOrder: index + 1,
      file,
      source,
    })),
  );

  if (mode === "batch") {
    return candidates;
  }

  return candidates
    .filter((candidate) => candidate.file.sampleCandidate === true)
    .sort((a, b) => {
      const aOrder = a.file.sampleOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.file.sampleOrder ?? Number.MAX_SAFE_INTEGER;
      return (
        aOrder - bOrder ||
        a.file.fileName.localeCompare(b.file.fileName) ||
        a.batchOrder - b.batchOrder
      );
    });
}

async function downloadDriveFile(
  driveFileId: string,
  driveAuth: DriveAuth,
): Promise<Buffer> {
  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}`,
  );
  url.searchParams.set("alt", "media");

  const response = await fetch(url, applyDriveAuth(url, {}, driveAuth));
  if (!response.ok) {
    const body = await response.text();
    const bodyPreview = compactBodyPreview(body);
    if (isSkippableDriveResponse(response.status, body)) {
      throw new SkippableDriveDownloadError(
        `Telechargement Drive ignore (${response.status}) pour ${driveFileId}: ${bodyPreview}`,
        response.status,
      );
    }

    throw new Error(
      `Erreur telechargement Drive ${response.status} pour ${driveFileId}: ${bodyPreview}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function writeDownloadErrorReport(input: {
  inventoryPath: string;
  lotId: string;
  outputDirectory: string;
  reportPath: string;
  skippedFiles: DownloadSkippedFile[];
}) {
  const report: DownloadErrorReport = {
    generatedAt: new Date().toISOString(),
    inventoryPath: input.inventoryPath,
    lotId: input.lotId,
    note:
      "Rapport local des telechargements Drive ignores. Les fichiers listes n'ont pas ete telecharges et aucun contenu n'a ete invente.",
    outputDirectory: input.outputDirectory,
    reportType: "download-errors",
    skippedFiles: input.skippedFiles,
  };

  await mkdir(path.dirname(input.reportPath), { recursive: true });
  await writeFile(input.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function isSkippableDriveResponse(status: number, body: string): boolean {
  if (status === 403 || status === 429) {
    return true;
  }

  const normalizedBody = body.toLocaleLowerCase("fr");
  return (
    normalizedBody.includes("downloadquotaexceeded") ||
    normalizedBody.includes("userratelimitexceeded") ||
    normalizedBody.includes("ratelimitexceeded") ||
    normalizedBody.includes("quota") ||
    normalizedBody.includes("abuse")
  );
}

function compactBodyPreview(body: string): string {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length > 500 ? `${compact.slice(0, 500)}...` : compact;
}

function formatDownloadFileName(candidate: DownloadCandidate): string {
  const order =
    typeof candidate.file.sampleOrder === "number"
      ? candidate.file.sampleOrder
      : candidate.batchOrder;
  const prefix = `${String(order).padStart(2, "0")}-`;

  return `${prefix}${sanitizeFileName(candidate.file.fileName)}`;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "drive-file";
}

function getUniqueFileName(fileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  let index = 2;
  let candidate = `${baseName}-${index}${extension}`;

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${baseName}-${index}${extension}`;
  }

  usedNames.add(candidate);
  return candidate;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getMode(): DownloadMode {
  const mode = getArg("--mode") ?? "sample";
  if (mode !== "sample" && mode !== "batch") {
    throw new Error('--mode doit etre "sample" ou "batch".');
  }

  return mode;
}

function getLimit(mode: DownloadMode): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return mode === "sample" ? 8 : 41;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
