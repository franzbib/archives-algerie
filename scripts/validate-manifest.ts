import { readFile } from "node:fs/promises";
import type {
  ArchiveManifest,
  ArchiveStatus,
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

async function main() {
  const manifestPath = getArg("--manifest") ?? "src/data/archives-manifest.json";
  const manifest = await readJson<ArchiveManifest>(manifestPath);
  const errors: string[] = [];

  if (!manifest.schemaVersion) {
    errors.push("schemaVersion est requis.");
  }

  if (!manifest.updatedAt) {
    errors.push("updatedAt est requis.");
  }

  if (!Array.isArray(manifest.collections)) {
    errors.push("collections doit etre un tableau.");
  }

  if (!Array.isArray(manifest.documents)) {
    errors.push("documents doit etre un tableau.");
  }

  const collectionIds = new Set<string>();
  const documentIds = new Set<string>();

  for (const collection of manifest.collections ?? []) {
    requireString(collection.id, "collection.id", errors);
    requireString(collection.title, `${collection.id}.title`, errors);
    requireString(
      collection.sourceInstitution,
      `${collection.id}.sourceInstitution`,
      errors,
    );
    requireString(collection.archiveReference, `${collection.id}.archiveReference`, errors);
    requireString(collection.region, `${collection.id}.region`, errors);
    requireString(collection.period, `${collection.id}.period`, errors);
    requireString(collection.description, `${collection.id}.description`, errors);
    requireString(collection.driveUrl, `${collection.id}.driveUrl`, errors);

    if (collectionIds.has(collection.id)) {
      errors.push(`Collection dupliquee: ${collection.id}`);
    }
    collectionIds.add(collection.id);

    if (!VALID_STATUSES.has(collection.status)) {
      errors.push(`${collection.id}.status invalide: ${collection.status}`);
    }

    if (!Number.isInteger(collection.documentCount) || collection.documentCount < 0) {
      errors.push(`${collection.id}.documentCount doit etre un entier positif.`);
    }
  }

  for (const document of manifest.documents ?? []) {
    requireString(document.id, "document.id", errors);
    requireString(document.collectionId, `${document.id}.collectionId`, errors);
    requireString(document.title, `${document.id}.title`, errors);
    requireString(document.dateLabel, `${document.id}.dateLabel`, errors);
    requireString(document.place, `${document.id}.place`, errors);
    requireString(document.driveUrl, `${document.id}.driveUrl`, errors);
    requireString(document.summary, `${document.id}.summary`, errors);

    if (documentIds.has(document.id)) {
      errors.push(`Document duplique: ${document.id}`);
    }
    documentIds.add(document.id);

    if (!collectionIds.has(document.collectionId)) {
      errors.push(`${document.id}.collectionId ne correspond a aucune collection.`);
    }

    if (!VALID_DOCUMENT_TYPES.has(document.documentType)) {
      errors.push(`${document.id}.documentType invalide: ${document.documentType}`);
    }

    if (!VALID_STATUSES.has(document.ocrStatus)) {
      errors.push(`${document.id}.ocrStatus invalide: ${document.ocrStatus}`);
    }

    for (const page of document.pages ?? []) {
      requireString(page.id, `${document.id}.pages[].id`, errors);
      requireString(page.label, `${page.id}.label`, errors);

      if (!Number.isInteger(page.pageNumber) || page.pageNumber < 1) {
        errors.push(`${page.id}.pageNumber doit etre un entier superieur a 0.`);
      }

      if (page.imageStatus !== "placeholder" && page.imageStatus !== "available") {
        errors.push(`${page.id}.imageStatus invalide: ${page.imageStatus}`);
      }

      if (!VALID_STATUSES.has(page.ocrTextStatus)) {
        errors.push(`${page.id}.ocrTextStatus invalide: ${page.ocrTextStatus}`);
      }
    }
  }

  for (const collection of manifest.collections ?? []) {
    const actualCount = (manifest.documents ?? []).filter(
      (document) => document.collectionId === collection.id,
    ).length;

    if (collection.documentCount !== actualCount) {
      errors.push(
        `${collection.id}.documentCount vaut ${collection.documentCount}, mais ${actualCount} document(s) sont rattaches.`,
      );
    }
  }

  if (errors.length > 0) {
    console.error(`Manifest invalid: ${manifestPath}`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Manifest valid: ${manifestPath}`);
  console.log(`Collections: ${manifest.collections.length}`);
  console.log(`Documents: ${manifest.documents.length}`);
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function requireString(value: unknown, field: string, errors: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${field} est requis.`);
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
