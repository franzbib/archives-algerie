import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

async function main() {
  const inventoryPath =
    getArg("--inventory") ?? "data/generated/drive-inventory.pilot.json";
  const outputDirectory = getArg("--out") ?? ".local/archive-sample/raw";
  const lotId = getArg("--lot-id") ?? "pilot-sample";
  const mode = getMode();
  const limit = getLimit(mode);
  const confirmed = process.argv.includes("--confirm");
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_DRIVE_API_KEY est requise pour telecharger l'echantillon.");
  }

  if (!confirmed) {
    throw new Error(
      "Telechargement refuse: ajoutez --confirm pour confirmer l'ecriture locale.",
    );
  }

  const inventory = await readJson<DriveInventory>(inventoryPath);
  const candidates = getDownloadCandidates(inventory, mode).slice(0, limit);

  if (candidates.length === 0) {
    throw new Error(
      mode === "sample"
        ? "Aucun fichier sampleCandidate: true trouve dans l'inventaire."
        : "Aucun fichier trouve dans l'inventaire pour le lot complet.",
    );
  }

  await mkdir(outputDirectory, { recursive: true });

  const manifestFiles: DownloadManifestFile[] = [];
  const usedNames = new Set<string>();

  for (const candidate of candidates) {
    const fileName = getUniqueFileName(
      formatDownloadFileName(candidate),
      usedNames,
    );
    const localPath = path.join(outputDirectory, fileName);
    const bytes = await downloadDriveFile(candidate.file.driveFileId, apiKey);
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
  apiKey: string,
): Promise<Buffer> {
  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}`,
  );
  url.searchParams.set("alt", "media");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Erreur telechargement Drive ${response.status} pour ${driveFileId}: ${await response.text()}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
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
