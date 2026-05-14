import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface DriveSource {
  collectionId?: string;
  id?: string;
  notes?: string;
  status?: "pilot" | "to_inventory";
  title: string;
  driveUrl: string;
}

interface DriveInventory {
  generatedAt: string;
  mode: "drive" | "manual_snapshot" | "mock";
  sourceFile: string;
  sourceCount: number;
  fileCount: number;
  warning: string;
  notes: string[];
  sources: DriveInventorySource[];
}

interface DriveInventorySource {
  collectionId: string;
  title: string;
  driveFolderUrl: string;
  files: DriveInventoryFile[];
  status: "to_inventory";
}

interface DriveInventoryFile {
  conversionNeeded: boolean;
  conversionTarget: "jpg" | "pdf" | "png" | null;
  createdTime?: string;
  fileKind: "image" | "pdf" | "unknown";
  fileName: string;
  mimeType: string;
  driveFileId: string;
  driveUrl: string;
  ingestionNote: string;
  modifiedTime?: string;
  preparationNote: string;
  preparationStatus:
    | "excluded"
    | "needs_ordering"
    | "ready_for_conversion"
    | "to_inventory";
  probablePageNumber: number | null;
  status: "to_inventory";
}

interface GoogleDriveFile {
  createdTime?: string;
  id: string;
  mimeType: string;
  modifiedTime?: string;
  name: string;
  webViewLink?: string;
}

interface GoogleDriveListResponse {
  files?: GoogleDriveFile[];
  nextPageToken?: string;
}

async function main() {
  const sourcePath = getArg("--sources") ?? "scripts/drive-sources.example.json";
  const outputPath = getArg("--out") ?? "data/generated/drive-inventory.json";
  const limit = getLimit();
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const sources = await readJson<DriveSource[]>(sourcePath);

  if (!Array.isArray(sources)) {
    throw new Error("Le fichier sources doit contenir un tableau de dossiers Drive.");
  }

  const notes: string[] = [
    "Inventaire brut: ne pas importer automatiquement dans le manifeste valide.",
    "Aucun fichier n'est telecharge par ce script.",
    "Aucun OCR, aucun appel OpenAI, aucun embedding.",
  ];

  if (!apiKey) {
    notes.push(
      "Mode mock: GOOGLE_DRIVE_API_KEY est absent. Les dossiers sont listes avec files: [].",
      "Pour activer le mode drive: definir GOOGLE_DRIVE_API_KEY puis relancer le script.",
    );
  }

  const inventorySources: DriveInventorySource[] = [];

  for (const source of sources) {
    validateSource(source);
    const collectionId = getCollectionId(source);

    let files: GoogleDriveFile[] = [];

    if (apiKey) {
      try {
        files = await listDriveFolderFiles(source.driveUrl, apiKey, limit);
      } catch (error) {
        const message = formatDriveError(error);
        notes.push(`Erreur Drive pour ${collectionId}: ${message}`);
        console.error(`Erreur Drive pour ${collectionId}: ${message}`);
      }
    }

    inventorySources.push({
      collectionId,
      title: source.title,
      driveFolderUrl: source.driveUrl,
      files: files.map(toInventoryFile),
      status: "to_inventory",
    });
  }

  const inventory: DriveInventory = {
    generatedAt: new Date().toISOString(),
    mode: apiKey ? "drive" : "mock",
    sourceFile: sourcePath,
    sourceCount: inventorySources.length,
    fileCount: inventorySources.reduce(
      (total, source) => total + source.files.length,
      0,
    ),
    warning:
      "Inventaire Drive brut: fichiers listes uniquement, contenu non lu, aucune notice validee.",
    notes,
    sources: inventorySources,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  console.log(`Drive inventory written: ${outputPath}`);
  console.log(`Mode: ${inventory.mode}`);
  console.log(`Limit: ${limit}`);
  console.log(`Sources: ${inventory.sourceCount}`);
  console.log(`Files: ${inventory.fileCount}`);
}

async function listDriveFolderFiles(
  driveFolderUrl: string,
  apiKey: string,
  limit: number,
): Promise<GoogleDriveFile[]> {
  const folderId = extractDriveFolderId(driveFolderUrl);
  if (!folderId) {
    throw new Error(`Impossible d'extraire l'identifiant Drive: ${driveFolderUrl}`);
  }

  const files: GoogleDriveFile[] = [];
  let pageToken: string | undefined;

  while (files.length < limit) {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    const remaining = limit - files.length;
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", `'${folderId}' in parents and trashed=false`);
    url.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType,webViewLink,createdTime,modifiedTime)",
    );
    url.searchParams.set("pageSize", String(Math.min(remaining, 1000)));

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Google Drive API error ${response.status}: ${formatGoogleDriveApiError(
          response.status,
          await response.text(),
        )}`,
      );
    }

    const payload = (await response.json()) as GoogleDriveListResponse;
    files.push(...(payload.files ?? []));
    pageToken = payload.nextPageToken;
    if (!pageToken) {
      break;
    }
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

function toInventoryFile(file: GoogleDriveFile): DriveInventoryFile {
  const qualification = qualifyDriveFile(file.mimeType);

  return {
    conversionNeeded: qualification.conversionNeeded,
    conversionTarget: qualification.conversionTarget,
    createdTime: file.createdTime,
    fileKind: qualification.fileKind,
    fileName: file.name,
    mimeType: file.mimeType,
    driveFileId: file.id,
    driveUrl: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
    ingestionNote: "Fichier liste depuis Drive ; contenu non lu.",
    modifiedTime: file.modifiedTime,
    preparationNote: qualification.preparationNote,
    preparationStatus: qualification.preparationStatus,
    probablePageNumber: null,
    status: "to_inventory",
  };
}

function qualifyDriveFile(mimeType: string): Pick<
  DriveInventoryFile,
  | "conversionNeeded"
  | "conversionTarget"
  | "fileKind"
  | "preparationNote"
  | "preparationStatus"
> {
  const normalizedMime = mimeType.toLocaleLowerCase("fr");

  if (normalizedMime === "image/heif" || normalizedMime === "image/heic") {
    return {
      conversionNeeded: true,
      conversionTarget: "jpg",
      fileKind: "image",
      preparationNote:
        "Image HEIC listee depuis Drive ; conversion necessaire avant OCR ; ordre et rattachement page/document a verifier.",
      preparationStatus: "needs_ordering",
    };
  }

  if (normalizedMime.startsWith("image/")) {
    return {
      conversionNeeded: false,
      conversionTarget: null,
      fileKind: "image",
      preparationNote:
        "Image listee depuis Drive ; ordre et rattachement page/document a verifier avant toute exploitation.",
      preparationStatus: "needs_ordering",
    };
  }

  if (normalizedMime === "application/pdf") {
    return {
      conversionNeeded: false,
      conversionTarget: null,
      fileKind: "pdf",
      preparationNote:
        "PDF liste depuis Drive ; structure interne et rattachement documentaire a verifier avant OCR.",
      preparationStatus: "to_inventory",
    };
  }

  return {
    conversionNeeded: false,
    conversionTarget: null,
    fileKind: "unknown",
    preparationNote:
      "Fichier liste depuis Drive ; type a verifier avant traitement.",
    preparationStatus: "to_inventory",
  };
}

function extractDriveFolderId(driveFolderUrl: string): string | null {
  const folderMatch = driveFolderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  try {
    const url = new URL(driveFolderUrl);
    return url.searchParams.get("id");
  } catch {
    return null;
  }
}

function validateSource(source: DriveSource) {
  const collectionId = getCollectionId(source);
  requireString(collectionId, "source.collectionId");
  requireString(source.title, `${collectionId}.title`);
  requireString(source.driveUrl, `${collectionId}.driveUrl`);
}

function getCollectionId(source: DriveSource): string {
  return source.collectionId ?? source.id ?? "";
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Champ requis manquant: ${field}`);
  }
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return 50;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

function formatDriveError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatGoogleDriveApiError(status: number, body: string): string {
  const commonHints: Record<number, string> = {
    400: "requete invalide ou dossier inaccessible.",
    403: "permission refusee, quota atteint ou API Drive non activee.",
    404: "dossier introuvable ou non accessible avec cette cle.",
  };

  return `${commonHints[status] ?? "erreur API Drive."} Reponse: ${body}`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
