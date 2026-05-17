import { existsSync } from "node:fs";
import { open, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type ConfidenceLevel = "low" | "medium" | "high";
type AssistedReadingStatus = "assisted_unavailable" | "assisted_unverified";
type UncertaintyIssue =
  | "mot_illisible"
  | "nom_propre_incertain"
  | "date_incertaine"
  | "lieu_incertain"
  | "sigle_incertain"
  | "lecture_probable";

interface AssistedReadingOutput {
  sourceImage: string;
  rawOcrTextFile: string;
  cleanOcrTextFile: string;
  assistedReadingText: string;
  uncertainties: AssistedReadingUncertainty[];
  note?: string;
  status: AssistedReadingStatus;
  humanValidation: {
    validated: false;
    validatedBy: null;
    validatedAt: null;
    notes: null;
  };
}

interface AssistedReadingUncertainty {
  fragment: string;
  suggestion: string;
  issue: UncertaintyIssue;
  confidence: ConfidenceLevel;
  note: string;
}

const DEFAULT_MODEL = "gpt-4.1";
const DEFAULT_WORKSPACE = ".local/archive-batch-boghari";
const DEFAULT_PROMPT_PATH = "prompts/ASSISTED_READING_VISION_PROMPT.md";
const DEFAULT_MAX_OCR_CHARS = 60_000;

async function main() {
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    throw new Error(
      "Generation vision refusee: ajoutez --confirm pour confirmer l'appel OpenAI et l'ecriture locale.",
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY est requise pour generer une lecture assistee vision.");
  }

  const inputPath = getRequiredArg("--input");
  const imagePath = getRequiredArg("--image");
  const workspacePath = getArg("--workspace") ?? DEFAULT_WORKSPACE;
  const outputDirectory = path.join(workspacePath, "assisted-reading-vision");
  const outputPath = getArg("--out") ?? getDefaultOutputPath(inputPath, workspacePath);
  const model = getArg("--model") ?? DEFAULT_MODEL;
  const promptPath = getArg("--prompt") ?? DEFAULT_PROMPT_PATH;
  const maxOcrChars = getPositiveIntegerArg("--max-ocr-chars", DEFAULT_MAX_OCR_CHARS);
  const rawOcrTextFile = inferRawOcrTextFile(inputPath);

  await requireFile(inputPath, "OCR nettoye");
  await requireFile(imagePath, "image JPG");
  await requireFile(promptPath, "prompt de lecture assistee vision");

  assertOutputPathAllowed(outputPath, outputDirectory);

  const cleanOcrInput = await readCleanOcrTextForPrompt(inputPath, maxOcrChars);
  if (cleanOcrInput.truncated) {
    console.warn(cleanOcrInput.note);
  }

  const promptTemplate = await readFile(promptPath, "utf8");
  const prompt = buildPrompt({
    cleanOcrText: cleanOcrInput.text,
    cleanOcrTextFile: inputPath,
    ocrInputNote: cleanOcrInput.note,
    promptTemplate,
    rawOcrTextFile,
    sourceImage: imagePath,
  });
  const imageDataUrl = await readImageAsDataUrl(imagePath);

  const generated = await generateAssistedReadingVision({
    apiKey,
    imageDataUrl,
    model,
    prompt,
  });
  const output = normalizeAssistedReadingOutput(generated, {
    cleanOcrTextFile: inputPath,
    ocrInputNote: cleanOcrInput.note,
    rawOcrTextFile,
    sourceImage: imagePath,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Vision assisted reading written: ${outputPath}`);
}

async function generateAssistedReadingVision(options: {
  apiKey: string;
  imageDataUrl: string;
  model: string;
  prompt: string;
}): Promise<unknown> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content: [
            {
              text: options.prompt,
              type: "input_text",
            },
            {
              image_url: options.imageDataUrl,
              type: "input_image",
            },
          ],
          role: "user",
        },
      ],
      model: options.model,
      text: {
        format: {
          name: "assisted_reading_vision",
          schema: assistedReadingJsonSchema,
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

function normalizeAssistedReadingOutput(
  value: unknown,
  enforced: {
    cleanOcrTextFile: string;
    ocrInputNote: string;
    rawOcrTextFile: string;
    sourceImage: string;
  },
): AssistedReadingOutput {
  const record = asRecord(value);
  const uncertainties = Array.isArray(record.uncertainties)
    ? record.uncertainties.map(normalizeUncertainty)
    : [];

  return {
    sourceImage: enforced.sourceImage,
    rawOcrTextFile: enforced.rawOcrTextFile,
    cleanOcrTextFile: enforced.cleanOcrTextFile,
    assistedReadingText: getString(record.assistedReadingText),
    note: mergeNotes(getString(record.note), enforced.ocrInputNote),
    uncertainties,
    status: normalizeStatus(record.status, getString(record.assistedReadingText)),
    humanValidation: {
      validated: false,
      validatedAt: null,
      validatedBy: null,
      notes: null,
    },
  };
}

function normalizeUncertainty(value: unknown): AssistedReadingUncertainty {
  const record = asRecord(value);
  return {
    fragment: getString(record.fragment),
    suggestion: getString(record.suggestion),
    issue: normalizeIssue(record.issue),
    confidence: normalizeConfidence(record.confidence),
    note: getString(record.note),
  };
}

function buildPrompt(options: {
  cleanOcrText: string;
  cleanOcrTextFile: string;
  ocrInputNote: string;
  promptTemplate: string;
  rawOcrTextFile: string;
  sourceImage: string;
}): string {
  return options.promptTemplate
    .replaceAll("{{sourceImage}}", options.sourceImage)
    .replaceAll("{{rawOcrTextFile}}", options.rawOcrTextFile)
    .replaceAll("{{cleanOcrTextFile}}", options.cleanOcrTextFile)
    .replaceAll("{{ocrInputNote}}", options.ocrInputNote)
    .replaceAll("{{cleanOcrText}}", options.cleanOcrText);
}

async function readCleanOcrTextForPrompt(
  filePath: string,
  maxChars: number,
): Promise<{ note: string; text: string; truncated: boolean }> {
  const fileStat = await stat(filePath);
  const maxBytesToRead = maxChars * 4;

  if (fileStat.size <= maxBytesToRead) {
    const text = await readFile(filePath, "utf8");
    if (text.length <= maxChars) {
      return { note: "", text, truncated: false };
    }

    return {
      note: getTruncationNote(filePath, maxChars, fileStat.size),
      text: text.slice(0, maxChars),
      truncated: true,
    };
  }

  const file = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(maxBytesToRead);
    const result = await file.read(buffer, 0, maxBytesToRead, 0);
    const text = buffer.subarray(0, result.bytesRead).toString("utf8");

    return {
      note: getTruncationNote(filePath, maxChars, fileStat.size),
      text: text.slice(0, maxChars),
      truncated: true,
    };
  } finally {
    await file.close();
  }
}

function getTruncationNote(filePath: string, maxChars: number, sizeBytes: number): string {
  return [
    `OCR nettoye tronque pour la lecture assistee vision: ${path.basename(filePath)}.`,
    `Seuls les ${maxChars} premiers caracteres environ ont ete fournis au modele.`,
    `Taille du fichier source: ${sizeBytes} octets.`,
    "Le fichier OCR local original n'a pas ete modifie.",
  ].join(" ");
}

function mergeNotes(generatedNote: string, enforcedNote: string): string {
  if (!enforcedNote) return generatedNote;
  if (!generatedNote) return enforcedNote;

  return `${generatedNote} ${enforcedNote}`;
}

async function readImageAsDataUrl(imagePath: string): Promise<string> {
  const extension = path.extname(imagePath).toLowerCase();
  if (extension !== ".jpg" && extension !== ".jpeg") {
    throw new Error("Image refusee: seule une image JPG/JPEG locale est attendue.");
  }

  const bytes = await readFile(imagePath);
  const mimeType = extension === ".jpeg" ? "image/jpeg" : "image/jpeg";
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
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
      if (!Array.isArray(content)) {
        continue;
      }

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

async function requireFile(filePath: string, label: string) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} introuvable: ${filePath}`);
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error(`${label} n'est pas un fichier: ${filePath}`);
  }
}

function assertOutputPathAllowed(outputPath: string, outputDirectory: string) {
  const portableOutputPath = toPortablePath(outputPath);
  const portableOutputDirectory = toPortablePath(outputDirectory);
  if (
    !portableOutputPath.startsWith(`${portableOutputDirectory}/`) &&
    portableOutputPath !== portableOutputDirectory
  ) {
    throw new Error(
      `Sortie refusee: le fichier doit etre ecrit dans ${portableOutputDirectory}.`,
    );
  }
}

function inferRawOcrTextFile(cleanOcrTextFile: string): string {
  return cleanOcrTextFile
    .replace(/\/clean\//, "/raw/")
    .replace(/\\clean\\/, "\\raw\\")
    .replace(/\.clean\.txt$/i, ".txt");
}

function getDefaultOutputPath(inputPath: string, workspacePath: string): string {
  const baseName = path.basename(inputPath, ".txt").replace(/\.clean$/i, "");
  return path.join(
    workspacePath,
    "assisted-reading-vision",
    `${baseName}.vision.assisted.json`,
  );
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function getRequiredArg(name: string): string {
  const value = getArg(name);
  if (!value) {
    throw new Error(`${name} est requis.`);
  }

  return value;
}

function getPositiveIntegerArg(name: string, fallback: number): number {
  const value = getArg(name);
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} doit etre un entier positif.`);
  }

  return parsed;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeIssue(value: unknown): UncertaintyIssue {
  const allowed: UncertaintyIssue[] = [
    "mot_illisible",
    "nom_propre_incertain",
    "date_incertaine",
    "lieu_incertain",
    "sigle_incertain",
    "lecture_probable",
  ];

  return allowed.includes(value as UncertaintyIssue)
    ? (value as UncertaintyIssue)
    : "lecture_probable";
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "low";
}

function normalizeStatus(
  value: unknown,
  assistedReadingText: string,
): AssistedReadingStatus {
  if (value === "assisted_unavailable" || value === "assisted_unverified") {
    return value;
  }

  return assistedReadingText.trim().length === 0
    ? "assisted_unavailable"
    : "assisted_unverified";
}

const assistedReadingJsonSchema = {
  additionalProperties: false,
  properties: {
    assistedReadingText: { type: "string" },
    cleanOcrTextFile: { type: "string" },
    humanValidation: {
      additionalProperties: false,
      properties: {
        notes: { type: ["string", "null"] },
        validated: { type: "boolean" },
        validatedAt: { type: ["string", "null"] },
        validatedBy: { type: ["string", "null"] },
      },
      required: ["validated", "validatedBy", "validatedAt", "notes"],
      type: "object",
    },
    rawOcrTextFile: { type: "string" },
    note: { type: "string" },
    sourceImage: { type: "string" },
    status: { enum: ["assisted_unavailable", "assisted_unverified"], type: "string" },
    uncertainties: {
      items: {
        additionalProperties: false,
        properties: {
          confidence: { enum: ["low", "medium", "high"], type: "string" },
          fragment: { type: "string" },
          issue: {
            enum: [
              "mot_illisible",
              "nom_propre_incertain",
              "date_incertaine",
              "lieu_incertain",
              "sigle_incertain",
              "lecture_probable",
            ],
            type: "string",
          },
          note: { type: "string" },
          suggestion: { type: "string" },
        },
        required: ["fragment", "suggestion", "issue", "confidence", "note"],
        type: "object",
      },
      type: "array",
    },
  },
  required: [
    "sourceImage",
    "rawOcrTextFile",
    "cleanOcrTextFile",
    "assistedReadingText",
    "note",
    "uncertainties",
    "status",
    "humanValidation",
  ],
  type: "object",
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
