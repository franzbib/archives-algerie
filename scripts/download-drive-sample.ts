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

interface DownloadManifest {
  downloadedAt: string;
  inventoryPath: string;
  outputDirectory: string;
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
  sampleNote: string | null;
  sampleOrder: number | null;
  sizeBytes: number;
}

async function main() {
  const inventoryPath =
    getArg("--inventory") ?? "data/generated/drive-inventory.pilot.json";
  const outputDirectory = getArg("--out") ?? ".local/archive-sample/raw";
  const limit = getLimit();
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
  const candidates = getSampleCandidates(inventory).slice(0, limit);

  if (candidates.length === 0) {
    throw new Error("Aucun fichier sampleCandidate: true trouve dans l'inventaire.");
  }

  await mkdir(outputDirectory, { recursive: true });

  const manifestFiles: DownloadManifestFile[] = [];
  const usedNames = new Set<string>();

  for (const candidate of candidates) {
    const fileName = getUniqueFileName(
      formatSampleFileName(candidate.file),
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
      sampleNote: candidate.file.sampleNote ?? null,
      sampleOrder: candidate.file.sampleOrder ?? null,
      sizeBytes: bytes.byteLength,
    });

    console.log(`Downloaded ${candidate.file.fileName} -> ${localPath}`);
  }

  const manifest: DownloadManifest = {
    downloadedAt: new Date().toISOString(),
    inventoryPath,
    outputDirectory,
    limit,
    fileCount: manifestFiles.length,
    warning:
      "Telechargement brut de l'echantillon pilote: aucune conversion, aucun OCR, aucune notice validee.",
    files: manifestFiles,
  };

  const manifestPath = path.join(
    path.dirname(outputDirectory),
    "download-manifest.json",
  );
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Download manifest written: ${manifestPath}`);
}

function getSampleCandidates(inventory: DriveInventory) {
  return inventory.sources
    .flatMap((source) =>
      source.files
        .filter((file) => file.sampleCandidate === true)
        .map((file) => ({ file, source })),
    )
    .sort((a, b) => {
      const aOrder = a.file.sampleOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.file.sampleOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || a.file.fileName.localeCompare(b.file.fileName);
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

function formatSampleFileName(file: DriveInventoryFile): string {
  const prefix =
    typeof file.sampleOrder === "number"
      ? `${String(file.sampleOrder).padStart(2, "0")}-`
      : "";

  return `${prefix}${sanitizeFileName(file.fileName)}`;
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

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return 8;
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
