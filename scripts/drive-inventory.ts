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
  mode: "drive" | "mock";
  sourceFile: string;
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
  fileName: string;
  mimeType: string;
  driveFileId: string;
  driveUrl: string;
  probablePageNumber: number | null;
  status: "to_inventory";
}

interface GoogleDriveFile {
  id: string;
  mimeType: string;
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
    );
  }

  const inventorySources: DriveInventorySource[] = [];

  for (const source of sources) {
    validateSource(source);
    const collectionId = getCollectionId(source);

    const files = apiKey
      ? await listDriveFolderFiles(source.driveUrl, apiKey)
      : [];

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
    notes,
    sources: inventorySources,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  console.log(`Drive inventory written: ${outputPath}`);
  console.log(`Mode: ${inventory.mode}`);
  console.log(`Sources: ${inventorySources.length}`);
  console.log(
    `Files: ${inventorySources.reduce((total, source) => total + source.files.length, 0)}`,
  );
}

async function listDriveFolderFiles(
  driveFolderUrl: string,
  apiKey: string,
): Promise<GoogleDriveFile[]> {
  const folderId = extractDriveFolderId(driveFolderUrl);
  if (!folderId) {
    throw new Error(`Impossible d'extraire l'identifiant Drive: ${driveFolderUrl}`);
  }

  const files: GoogleDriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", `'${folderId}' in parents and trashed=false`);
    url.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType,webViewLink)",
    );
    url.searchParams.set("pageSize", "1000");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Google Drive API error ${response.status}: ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as GoogleDriveListResponse;
    files.push(...(payload.files ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

function toInventoryFile(file: GoogleDriveFile): DriveInventoryFile {
  return {
    fileName: file.name,
    mimeType: file.mimeType,
    driveFileId: file.id,
    driveUrl: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
    probablePageNumber: inferProbablePageNumber(file.name),
    status: "to_inventory",
  };
}

function inferProbablePageNumber(fileName: string): number | null {
  const patterns = [
    /(?:^|[^a-z])p(?:age)?[-_ ]?(\d{1,4})(?:\D|$)/i,
    /(?:^|[_ -])(\d{1,4})(?:\.[^.]+$)/,
  ];

  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match?.[1]) {
      return Number.parseInt(match[1], 10);
    }
  }

  return null;
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

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
