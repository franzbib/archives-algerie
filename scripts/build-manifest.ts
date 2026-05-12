import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ArchiveManifest,
  ArchiveStatus,
  Collection,
  Document,
  DocumentType,
} from "../src/types/archive";

const VALID_STATUSES = new Set<ArchiveStatus>([
  "to_inventory",
  "inventoried",
  "ocr_pending",
  "ocr_done",
  "indexed",
  "verified",
]);

const VALID_DOCUMENT_TYPES = new Set<DocumentType>([
  "renseignement",
  "rapport",
  "correspondance",
  "tract",
  "carte",
  "microfilm",
  "photographie",
  "temoignage",
  "autre",
]);

interface SourceConfig {
  schemaVersion?: string;
  collections: Collection[];
  documents?: Document[];
}

async function main() {
  const configPath = getArg("--config") ?? "scripts/archive-sources.json";
  const outPath = getArg("--out") ?? "src/data/archives-manifest.json";
  const config = await readJson<SourceConfig>(configPath);

  if (!Array.isArray(config.collections)) {
    throw new Error("Config invalide: `collections` doit etre un tableau.");
  }

  const collections = config.collections.map(normalizeCollection);
  const documents = (config.documents ?? []).map(normalizeDocument);
  const manifest: ArchiveManifest = {
    schemaVersion: config.schemaVersion ?? "0.2.0",
    updatedAt: new Date().toISOString().slice(0, 10),
    collections: collections.map((collection) => ({
      ...collection,
      documentCount:
        collection.documentCount ||
        documents.filter((document) => document.collectionId === collection.id).length,
    })),
    documents,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Manifest generated: ${outPath}`);
  console.log(`Collections: ${manifest.collections.length}`);
  console.log(`Documents: ${manifest.documents.length}`);
}

function normalizeCollection(collection: Collection): Collection {
  assertRequired(collection.id, "collection.id");
  assertRequired(collection.title, `${collection.id}.title`);
  assertRequired(collection.sourceInstitution, `${collection.id}.sourceInstitution`);
  assertRequired(collection.archiveReference, `${collection.id}.archiveReference`);
  assertRequired(collection.region, `${collection.id}.region`);
  assertRequired(collection.period, `${collection.id}.period`);
  assertRequired(collection.description, `${collection.id}.description`);
  assertRequired(collection.driveUrl, `${collection.id}.driveUrl`);

  if (!VALID_STATUSES.has(collection.status)) {
    throw new Error(`${collection.id}.status invalide: ${collection.status}`);
  }

  return {
    ...collection,
    documentCount: collection.documentCount ?? 0,
  };
}

function normalizeDocument(document: Document): Document {
  assertRequired(document.id, "document.id");
  assertRequired(document.collectionId, `${document.id}.collectionId`);
  assertRequired(document.title, `${document.id}.title`);
  assertRequired(document.dateLabel, `${document.id}.dateLabel`);
  assertRequired(document.place, `${document.id}.place`);
  assertRequired(document.driveUrl, `${document.id}.driveUrl`);
  assertRequired(document.summary, `${document.id}.summary`);

  if (!VALID_DOCUMENT_TYPES.has(document.documentType)) {
    throw new Error(`${document.id}.documentType invalide: ${document.documentType}`);
  }

  if (!VALID_STATUSES.has(document.ocrStatus)) {
    throw new Error(`${document.id}.ocrStatus invalide: ${document.ocrStatus}`);
  }

  return {
    ...document,
    peopleMentioned: document.peopleMentioned ?? [],
    keywords: document.keywords ?? [],
    pages: document.pages ?? [],
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function assertRequired(value: unknown, field: string) {
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
