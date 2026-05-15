import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type DetectedLanguage = "fr" | "ar" | "fr+ar" | "other" | "illegible";
type DetectedScript = "latin" | "arabic" | "other" | "illegible";
type ConfidenceLevel = "low" | "medium" | "high";

type ArchiveBatch = {
  lotId: string;
  collectionId: string;
  title: string;
  assetManifest: string | null;
};

type ArchiveBatchesManifest = {
  batches: ArchiveBatch[];
};

type AssetManifest = {
  assets: RawAsset[];
};

type RawAsset = {
  collectionId: string;
  originalDriveFileId: string;
  originalDriveUrl: string;
  localJpgFile?: string;
  localJpgFileName?: string;
  r2ObjectKey: string;
  publicUrl: string;
  reviewId?: string;
};

type LanguageDetectionResult = {
  lotId: string;
  reviewId: string;
  sourceFileName: string;
  detectedLanguages: DetectedLanguage[];
  detectedScripts: DetectedScript[];
  confidence: ConfidenceLevel;
  method: "vision_language_detection";
  notes: string;
  humanValidated: false;
};

type LanguageDetectionFile = {
  generatedAt: string;
  lotId: string;
  results: LanguageDetectionResult[];
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_LIMIT = 10;
const BATCH_MANIFEST_PATH = "data/generated/archive-batches.example.json";

async function main() {
  const confirmed = process.argv.includes("--confirm");
  if (!confirmed) {
    throw new Error(
      "Detection linguistique refusee: ajoutez --confirm pour confirmer l'appel OpenAI et l'ecriture locale.",
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY est requise pour detecter les langues par vision.");
  }

  const lotId = getRequiredArg("--lot");
  const reviewId = getArg("--review-id");
  const limit = getNumberArg("--limit") ?? DEFAULT_LIMIT;
  const model = getArg("--model") ?? DEFAULT_MODEL;
  const outputPath = path.join(
    ".local",
    "archive-batches",
    lotId,
    "language-detection",
    "language-detection.json",
  );

  const batch = await getBatchById(lotId);
  if (!batch.assetManifest) {
    throw new Error(`Lot sans manifeste d'assets publies: ${lotId}`);
  }

  const assets = await getAssetsForBatch(batch);
  const selectedAssets = selectAssets(assets, { limit, reviewId });
  if (selectedAssets.length === 0) {
    throw new Error(
      reviewId
        ? `Aucune page trouvee pour ${lotId}/${reviewId}.`
        : `Aucune page trouvee pour le lot ${lotId}.`,
    );
  }

  const results: LanguageDetectionResult[] = [];
  for (const asset of selectedAssets) {
    const normalizedAsset = normalizeAsset(asset);
    const imageInput = await resolveImageInput(lotId, normalizedAsset);
    console.log(
      `Detection langue: ${lotId}/${normalizedAsset.reviewId} (${imageInput.sourceDescription})`,
    );

    const generated = await detectLanguages({
      apiKey,
      imageUrl: imageInput.imageUrl,
      model,
      sourceFileName: normalizedAsset.localJpgFileName,
    });

    results.push(
      normalizeDetectionResult(generated, {
        lotId,
        reviewId: normalizedAsset.reviewId,
        sourceDescription: imageInput.sourceDescription,
        sourceFileName: normalizedAsset.localJpgFileName,
      }),
    );
  }

  await writeMergedOutput(outputPath, lotId, results);
  console.log(`Language detection written: ${outputPath}`);
}

async function detectLanguages(options: {
  apiKey: string;
  imageUrl: string;
  model: string;
  sourceFileName: string;
}): Promise<unknown> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content: [
            {
              text: buildPrompt(options.sourceFileName),
              type: "input_text",
            },
            {
              image_url: options.imageUrl,
              type: "input_image",
            },
          ],
          role: "user",
        },
      ],
      model: options.model,
      text: {
        format: {
          name: "page_language_detection",
          schema: languageDetectionSchema,
          strict: true,
          type: "json_schema",
        },
      },
    }),
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Erreur OpenAI ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractResponseText(payload);
  return JSON.parse(outputText) as unknown;
}

function buildPrompt(sourceFileName: string): string {
  return [
    "Tu analyses une page d'archive sous forme d'image.",
    "Objectif strict: detecter uniquement la ou les langues et ecritures visibles.",
    "Ne transcris aucun mot, aucune phrase, aucun nom propre, aucune date.",
    "Ne resume pas le contenu et n'ajoute pas de contexte historique.",
    "Categories de langue autorisees: fr, ar, fr+ar, other, illegible.",
    "Categories d'ecriture autorisees: latin, arabic, other, illegible.",
    "Si la page combine francais et arabe, utilise detectedLanguages: ['fr','ar'] ou ['fr+ar'] selon ce qui est le plus clair.",
    "Si l'image est trop floue ou vide, utilise illegible avec confidence low.",
    `Nom de fichier source: ${sourceFileName}`,
  ].join("\n");
}

function normalizeDetectionResult(
  value: unknown,
  enforced: {
    lotId: string;
    reviewId: string;
    sourceDescription: string;
    sourceFileName: string;
  },
): LanguageDetectionResult {
  const record = asRecord(value);
  const detectedLanguages = normalizeLanguages(record.detectedLanguages);
  const detectedScripts = normalizeScripts(record.detectedScripts);
  const confidence = normalizeConfidence(record.confidence);
  const generatedNotes = getString(record.notes);
  const notes = [
    generatedNotes,
    `Source image utilisee: ${enforced.sourceDescription}.`,
    "Detection linguistique uniquement ; aucune transcription produite.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    lotId: enforced.lotId,
    reviewId: enforced.reviewId,
    sourceFileName: enforced.sourceFileName,
    detectedLanguages,
    detectedScripts,
    confidence,
    method: "vision_language_detection",
    notes,
    humanValidated: false,
  };
}

async function getBatchById(lotId: string): Promise<ArchiveBatch> {
  const manifest = JSON.parse(
    await readFile(BATCH_MANIFEST_PATH, "utf8"),
  ) as ArchiveBatchesManifest;
  const batch = manifest.batches.find((item) => item.lotId === lotId);
  if (!batch) {
    throw new Error(`Lot inconnu: ${lotId}`);
  }

  return batch;
}

async function getAssetsForBatch(batch: ArchiveBatch): Promise<RawAsset[]> {
  if (!batch.assetManifest) return [];

  const assetManifest = JSON.parse(
    await readFile(batch.assetManifest, "utf8"),
  ) as AssetManifest;

  return assetManifest.assets ?? [];
}

function selectAssets(
  assets: RawAsset[],
  options: { limit: number; reviewId?: string },
): RawAsset[] {
  const normalizedAssets = assets.map(normalizeAsset);
  if (options.reviewId) {
    return normalizedAssets.filter((asset) => asset.reviewId === options.reviewId);
  }

  return normalizedAssets.slice(0, Math.max(1, options.limit));
}

function normalizeAsset(asset: RawAsset): RawAsset & {
  localJpgFileName: string;
  reviewId: string;
} {
  const localJpgFileName =
    asset.localJpgFileName ?? getFileNameFromPath(asset.localJpgFile ?? asset.r2ObjectKey);
  const reviewId = asset.reviewId ?? getReviewIdFromFileName(localJpgFileName);

  return {
    ...asset,
    localJpgFileName,
    reviewId,
  };
}

async function resolveImageInput(
  lotId: string,
  asset: RawAsset & { localJpgFileName: string },
): Promise<{ imageUrl: string; sourceDescription: string }> {
  const candidatePaths = [
    path.join(".local", "archive-batches", lotId, "converted", asset.localJpgFileName),
    asset.localJpgFile,
  ].filter(Boolean) as string[];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      await requireFile(candidatePath, "image locale");
      return {
        imageUrl: await readImageAsDataUrl(candidatePath),
        sourceDescription: `image locale ${toPortablePath(candidatePath)}`,
      };
    }
  }

  if (!asset.publicUrl) {
    throw new Error(`Aucune image R2 disponible pour ${asset.localJpgFileName}.`);
  }

  return {
    imageUrl: asset.publicUrl,
    sourceDescription: `image R2 ${asset.publicUrl}`,
  };
}

async function writeMergedOutput(
  outputPath: string,
  lotId: string,
  newResults: LanguageDetectionResult[],
) {
  const existing = await readExistingOutput(outputPath);
  const byReviewId = new Map<string, LanguageDetectionResult>();

  for (const result of existing?.results ?? []) {
    byReviewId.set(result.reviewId, result);
  }
  for (const result of newResults) {
    byReviewId.set(result.reviewId, result);
  }

  const output: LanguageDetectionFile = {
    generatedAt: new Date().toISOString(),
    lotId,
    results: [...byReviewId.values()].sort((first, second) =>
      first.reviewId.localeCompare(second.reviewId, "fr", { numeric: true }),
    ),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

async function readExistingOutput(
  outputPath: string,
): Promise<LanguageDetectionFile | null> {
  if (!existsSync(outputPath)) return null;

  const parsed = JSON.parse(await readFile(outputPath, "utf8")) as LanguageDetectionFile;
  if (!Array.isArray(parsed.results)) return null;

  return parsed;
}

async function readImageAsDataUrl(imagePath: string): Promise<string> {
  const extension = path.extname(imagePath).toLowerCase();
  if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {
    throw new Error("Image locale refusee: seuls JPG/JPEG/PNG sont acceptes.");
  }

  const bytes = await readFile(imagePath);
  const mimeType = extension === ".png" ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

async function requireFile(filePath: string, label: string) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error(`${label} n'est pas un fichier: ${filePath}`);
  }
}

function extractResponseText(payload: unknown): string {
  const record = asRecord(payload);
  const outputText = record.output_text;
  if (typeof outputText === "string") {
    return outputText;
  }

  const output = record.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const itemRecord = asRecord(item);
      const content = itemRecord.content;
      if (!Array.isArray(content)) continue;

      for (const contentItem of content) {
        const contentRecord = asRecord(contentItem);
        if (typeof contentRecord.text === "string") {
          return contentRecord.text;
        }
      }
    }
  }

  throw new Error("Reponse OpenAI invalide: texte JSON introuvable.");
}

function normalizeLanguages(value: unknown): DetectedLanguage[] {
  const allowed: DetectedLanguage[] = ["fr", "ar", "fr+ar", "other", "illegible"];
  const values = Array.isArray(value) ? value : [];
  const normalized = values.filter((item): item is DetectedLanguage =>
    allowed.includes(item as DetectedLanguage),
  );

  return normalized.length > 0 ? normalized : ["illegible"];
}

function normalizeScripts(value: unknown): DetectedScript[] {
  const allowed: DetectedScript[] = ["latin", "arabic", "other", "illegible"];
  const values = Array.isArray(value) ? value : [];
  const normalized = values.filter((item): item is DetectedScript =>
    allowed.includes(item as DetectedScript),
  );

  return normalized.length > 0 ? normalized : ["illegible"];
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "low";
}

function getRequiredArg(name: string): string {
  const value = getArg(name);
  if (!value) {
    throw new Error(`${name} est requis.`);
  }

  return value;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getNumberArg(name: string): number | undefined {
  const value = getArg(name);
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} doit etre un entier positif.`);
  }

  return parsed;
}

function getFileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function getReviewIdFromFileName(fileName: string): string {
  const match = fileName.match(/^(\d{1,4})[-_]/);
  if (!match) {
    return fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  }

  return `page-${match[1].padStart(2, "0")}`;
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const languageDetectionSchema = {
  additionalProperties: false,
  properties: {
    confidence: { enum: ["low", "medium", "high"], type: "string" },
    detectedLanguages: {
      items: { enum: ["fr", "ar", "fr+ar", "other", "illegible"], type: "string" },
      type: "array",
    },
    detectedScripts: {
      items: { enum: ["latin", "arabic", "other", "illegible"], type: "string" },
      type: "array",
    },
    humanValidated: { enum: [false], type: "boolean" },
    method: { enum: ["vision_language_detection"], type: "string" },
    notes: { type: "string" },
  },
  required: [
    "detectedLanguages",
    "detectedScripts",
    "confidence",
    "method",
    "notes",
    "humanValidated",
  ],
  type: "object",
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
