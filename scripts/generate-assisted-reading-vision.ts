import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type ConfidenceLevel = "low" | "medium" | "high";
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
  status: "assisted_unverified";
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
const DEFAULT_OUTPUT_DIRECTORY =
  ".local/archive-batch-boghari/assisted-reading-vision";
const DEFAULT_PROMPT_PATH = "prompts/ASSISTED_READING_VISION_PROMPT.md";

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
  const outputPath = getArg("--out") ?? getDefaultOutputPath(inputPath);
  const model = getArg("--model") ?? DEFAULT_MODEL;
  const promptPath = getArg("--prompt") ?? DEFAULT_PROMPT_PATH;
  const rawOcrTextFile = inferRawOcrTextFile(inputPath);

  await requireFile(inputPath, "OCR nettoye");
  await requireFile(imagePath, "image JPG");
  await requireFile(promptPath, "prompt de lecture assistee vision");

  assertOutputPathAllowed(outputPath);

  const cleanOcrText = await readFile(inputPath, "utf8");
  const promptTemplate = await readFile(promptPath, "utf8");
  const prompt = buildPrompt({
    cleanOcrText,
    cleanOcrTextFile: inputPath,
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
    uncertainties,
    status: "assisted_unverified",
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
  promptTemplate: string;
  rawOcrTextFile: string;
  sourceImage: string;
}): string {
  return options.promptTemplate
    .replaceAll("{{sourceImage}}", options.sourceImage)
    .replaceAll("{{rawOcrTextFile}}", options.rawOcrTextFile)
    .replaceAll("{{cleanOcrTextFile}}", options.cleanOcrTextFile)
    .replaceAll("{{cleanOcrText}}", options.cleanOcrText);
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

function assertOutputPathAllowed(outputPath: string) {
  const portableOutputPath = toPortablePath(outputPath);
  if (
    !portableOutputPath.startsWith(`${DEFAULT_OUTPUT_DIRECTORY}/`) &&
    portableOutputPath !== DEFAULT_OUTPUT_DIRECTORY
  ) {
    throw new Error(
      `Sortie refusee: le fichier doit etre ecrit dans ${DEFAULT_OUTPUT_DIRECTORY}.`,
    );
  }
}

function inferRawOcrTextFile(cleanOcrTextFile: string): string {
  return cleanOcrTextFile
    .replace(/\/clean\//, "/raw/")
    .replace(/\\clean\\/, "\\raw\\")
    .replace(/\.clean\.txt$/i, ".txt");
}

function getDefaultOutputPath(inputPath: string): string {
  const baseName = path.basename(inputPath, ".txt").replace(/\.clean$/i, "");
  return path.join(DEFAULT_OUTPUT_DIRECTORY, `${baseName}.vision.assisted.json`);
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
    sourceImage: { type: "string" },
    status: { enum: ["assisted_unverified"], type: "string" },
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
