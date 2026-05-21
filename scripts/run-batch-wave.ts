import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

type ArchiveBatchStatus =
  | "planned"
  | "inventoried"
  | "processed_local"
  | "published"
  | "review_ready"
  | "published_unvalidated";

interface ArchiveBatch {
  lotId: string;
  collectionId: string;
  title: string;
  sourceType: "google_drive" | "manual" | "unknown";
  status: ArchiveBatchStatus;
  driveSource: {
    driveFolderUrl: string | null;
    inventoryManifest: string | null;
  };
  assetManifest: string | null;
  assistedReadingManifest: string | null;
  reviewRoute: string | null;
  legacyReviewRoute: string | null;
  itemCount: number | null;
  notes: string;
}

interface ArchiveBatchesManifest {
  generatedAt: string;
  schema: string;
  batches: ArchiveBatch[];
}

interface DriveRootInventory {
  lots?: DriveRootInventoryLot[];
}

interface DriveRootInventoryLot {
  driveFolderUrl?: string;
  matchedLotId?: string | null;
  priority?: string;
}

interface PublicAssetsManifest {
  assetCount?: number;
  assets?: unknown[];
}

interface BatchSummaryReport {
  counts?: {
    assistedReadingFiles?: number;
    cleanOcrFiles?: number;
    convertedImages?: number;
    rawFiles?: number;
  };
  status?: {
    publicManifestExists?: boolean;
  };
}

interface LocalAssistedReading {
  assistedReadingText?: string;
  confidence?: ConfidenceLevel;
  humanValidation?: {
    validated?: boolean;
  };
  sourceImage?: string;
  status?: string;
  uncertainties?: AssistedReadingUncertainty[];
}

interface AssistedReadingUncertainty {
  confidence?: ConfidenceLevel;
  fragment?: string;
  issue?: string;
  note?: string;
  suggestion?: string;
}

type ConfidenceLevel = "low" | "medium" | "high";
type AssistedReadingStatus = "assisted_unavailable" | "assisted_unverified";

interface PromotedAssistedReading {
  reviewId: string;
  sourceImage: string;
  assistedReadingText: string;
  uncertainties: {
    confidence: ConfidenceLevel;
    fragment: string;
    issue: string;
    note: string;
    suggestion: string;
  }[];
  confidence: ConfidenceLevel;
  status: AssistedReadingStatus;
  humanValidation: {
    validated: false;
    validatedAt: null;
    validatedBy: null;
    notes: null;
  };
  note:
    | "Aucune lecture assistee exploitable produite pour cette page."
    | "Lecture assistee IA non validee ; a verifier sur l'image.";
}

interface Config {
  confirm: boolean;
  continueOnError: boolean;
  dryRun: boolean;
  limit: number;
  lots: string[];
  skipFlags: string[];
  wave: string | null;
}

interface LotRunResult {
  lotId: string;
  status: "dry_run" | "failed" | "succeeded";
  error?: string;
}

const BATCHES_MANIFEST_PATH = "data/generated/archive-batches.example.json";
const DRIVE_ROOT_INVENTORY_PATH = ".local/drive-inventory/drive-root-inventory.json";
const ARCHIVE_BATCHES_MODULE_PATH = "src/lib/archiveBatches.ts";
const GENERATED_BATCHES_DIRECTORY = "data/generated/batches";
const LOCAL_BATCHES_DIRECTORY = ".local/archive-batches";
const REQUIRED_ENVIRONMENT = [
  "GOOGLE_SERVICE_ACCOUNT_KEY_PATH",
  "OPENAI_API_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
];
const AGENT_SKIP_FLAGS = [
  "--skip-inventory",
  "--skip-download",
  "--skip-conversion",
  "--skip-ocr",
  "--skip-normalization",
  "--skip-vision",
  "--skip-upload",
];

async function main() {
  const config = await getConfig();
  const manifest = await readJson<ArchiveBatchesManifest>(BATCHES_MANIFEST_PATH);
  const batches = resolveTargetBatches(config, manifest);

  printPlan(config, batches);

  if (config.dryRun) {
    return;
  }

  if (!config.confirm) {
    throw new Error(
      "Automatisation refusee: relancez avec --confirm apres verification de la liste des lots.",
    );
  }

  requireEnvironment();

  const results: LotRunResult[] = [];
  for (const batch of batches) {
    try {
      await processLot(batch, config);
      results.push({ lotId: batch.lotId, status: "succeeded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ error: message, lotId: batch.lotId, status: "failed" });
      await writeLotAutomationReport(batch.lotId, {
        error: message,
        generatedAt: new Date().toISOString(),
        lotId: batch.lotId,
        status: "failed",
      });

      if (!config.continueOnError) {
        throw error;
      }

      console.error(`[WAVE WARNING] ${batch.lotId} echoue, poursuite activee.`);
    }
  }

  await runVerificationCommands();
  printResults(results);
}

async function processLot(batch: ArchiveBatch, config: Config) {
  console.log(`\n[LOT] ${batch.lotId}`);
  await runCommand([
    "npm.cmd",
    "run",
    "batch:agent",
    "--",
    "--lot",
    batch.lotId,
    "--limit",
    String(config.limit),
    "--confirm",
    ...config.skipFlags,
  ]);

  const counts = await verifyLocalLotOutputs(batch.lotId);
  await promoteLotOutputs(batch, counts);
  await writeLotAutomationReport(batch.lotId, {
    counts,
    generatedAt: new Date().toISOString(),
    lotId: batch.lotId,
    status: "succeeded",
  });
}

async function verifyLocalLotOutputs(lotId: string) {
  const workspace = path.join(LOCAL_BATCHES_DIRECTORY, lotId);
  const summaryPath = path.join(workspace, "reports", "batch-summary.json");
  const publicAssetsPath = path.join(workspace, "public", "public-assets.json");
  const assistedReadingsDirectory = path.join(workspace, "assisted-reading-vision");
  const cleanOcrDirectory = path.join(workspace, "ocr", "clean");

  const summary = await readJson<BatchSummaryReport>(summaryPath);
  const publicAssets = await readJson<PublicAssetsManifest>(publicAssetsPath);
  const assistedReadingFiles = await countFiles(
    assistedReadingsDirectory,
    (fileName) => fileName.endsWith(".assisted.json"),
  );
  const cleanOcrFiles = await countFiles(cleanOcrDirectory, (fileName) =>
    fileName.endsWith(".txt"),
  );
  const publicAssetCount = publicAssets.assets?.length ?? 0;

  if (!summary.status?.publicManifestExists) {
    throw new Error(`${lotId}: manifeste public local absent selon batch-summary.json.`);
  }

  assertEqual(lotId, "assets publics", publicAssets.assetCount ?? 0, publicAssetCount);
  assertEqual(lotId, "assets publics vs OCR clean", publicAssetCount, cleanOcrFiles);
  assertEqual(lotId, "lectures assistees vs OCR clean", assistedReadingFiles, cleanOcrFiles);
  assertEqual(
    lotId,
    "summary clean OCR",
    summary.counts?.cleanOcrFiles ?? 0,
    cleanOcrFiles,
  );
  assertEqual(
    lotId,
    "summary lectures assistees",
    summary.counts?.assistedReadingFiles ?? 0,
    assistedReadingFiles,
  );

  return {
    assistedReadingFiles,
    cleanOcrFiles,
    publicAssetCount,
  };
}

async function promoteLotOutputs(
  batch: ArchiveBatch,
  counts: Awaited<ReturnType<typeof verifyLocalLotOutputs>>,
) {
  const generatedDirectory = path.join(GENERATED_BATCHES_DIRECTORY, batch.lotId);
  const localDirectory = path.join(LOCAL_BATCHES_DIRECTORY, batch.lotId);
  const publicAssetsTarget = path.join(generatedDirectory, "public-assets.json");
  const assistedReadingsTarget = path.join(generatedDirectory, "assisted-readings.json");

  await mkdir(generatedDirectory, { recursive: true });
  await copyFile(
    path.join(localDirectory, "public", "public-assets.json"),
    publicAssetsTarget,
  );
  await writePromotedAssistedReadings(
    path.join(localDirectory, "assisted-reading-vision"),
    assistedReadingsTarget,
  );
  await updateArchiveBatchesManifest(batch, counts.publicAssetCount);
  await updateArchiveBatchesModule(batch.lotId);
}

async function writePromotedAssistedReadings(
  inputDirectory: string,
  outputPath: string,
) {
  const files = (await readdir(inputDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".assisted.json"))
    .map((entry) => path.join(inputDirectory, entry.name))
    .sort();

  if (files.length === 0) {
    throw new Error(`Aucune lecture assistee locale dans ${inputDirectory}.`);
  }

  const readings = await Promise.all(files.map(promoteAssistedReadingFile));
  await writeJson(outputPath, readings);
}

async function promoteAssistedReadingFile(
  filePath: string,
): Promise<PromotedAssistedReading> {
  const reading = await readJson<LocalAssistedReading>(filePath);
  const sourceImage = getSafeSourceImage(reading.sourceImage, filePath);
  const assistedReadingText =
    typeof reading.assistedReadingText === "string" ? reading.assistedReadingText : "";
  const status = normalizeAssistedReadingStatus(reading.status, assistedReadingText);

  if (reading.humanValidation?.validated !== false) {
    throw new Error(`${filePath}: humanValidation.validated doit etre false.`);
  }

  return {
    assistedReadingText: status === "assisted_unavailable" ? "" : assistedReadingText,
    confidence:
      status === "assisted_unavailable"
        ? "low"
        : normalizeConfidence(reading.confidence),
    humanValidation: {
      notes: null,
      validated: false,
      validatedAt: null,
      validatedBy: null,
    },
    note:
      status === "assisted_unavailable"
        ? "Aucune lecture assistee exploitable produite pour cette page."
        : "Lecture assistee IA non validee ; a verifier sur l'image.",
    reviewId: getReviewId(filePath, sourceImage),
    sourceImage,
    status,
    uncertainties:
      status === "assisted_unavailable"
        ? []
        : (reading.uncertainties ?? []).map((uncertainty) => ({
            confidence: normalizeConfidence(uncertainty.confidence),
            fragment: uncertainty.fragment ?? "",
            issue: uncertainty.issue ?? "lecture_probable",
            note: uncertainty.note ?? "",
            suggestion: uncertainty.suggestion ?? "",
          })),
  };
}

async function updateArchiveBatchesManifest(batch: ArchiveBatch, itemCount: number) {
  const manifest = await readJson<ArchiveBatchesManifest>(BATCHES_MANIFEST_PATH);
  const target = manifest.batches.find((item) => item.lotId === batch.lotId);

  if (!target) {
    throw new Error(`Lot absent du registre: ${batch.lotId}`);
  }

  target.status = "review_ready";
  target.assetManifest = `data/generated/batches/${batch.lotId}/public-assets.json`;
  target.assistedReadingManifest =
    `data/generated/batches/${batch.lotId}/assisted-readings.json`;
  target.reviewRoute = `/lots/${batch.lotId}`;
  target.legacyReviewRoute = null;
  target.itemCount = itemCount;
  target.notes = buildPromotedNotes(target.notes);

  await writeJson(BATCHES_MANIFEST_PATH, manifest);
}

async function updateArchiveBatchesModule(lotId: string) {
  const raw = await readFile(ARCHIVE_BATCHES_MODULE_PATH, "utf8");
  const importBase = `../../data/generated/batches/${lotId}`;
  const assetKey = `data/generated/batches/${lotId}/public-assets.json`;
  const readingKey = `data/generated/batches/${lotId}/assisted-readings.json`;
  const identifier = toCamelCase(lotId);
  let updated = raw;

  if (!updated.includes(`${identifier}PublicAssets`)) {
    const importInsertion =
      `import ${identifier}AssistedReadings from "${importBase}/assisted-readings.json";\n` +
      `import ${identifier}PublicAssets from "${importBase}/public-assets.json";\n`;
    updated = updated.replace(
      /import tiaretZaouiasAssistedReadings from /,
      `${importInsertion}import tiaretZaouiasAssistedReadings from `,
    );
  }

  if (!updated.includes(`"${assetKey}"`)) {
    updated = updated.replace(
      /  "data\/generated\/batches\/lot-tiaret-zaouias-001\/public-assets\.json":/,
      `  "${assetKey}":\n    ${identifier}PublicAssets as AssetManifest,\n  "data/generated/batches/lot-tiaret-zaouias-001/public-assets.json":`,
    );
  }

  if (!updated.includes(`"${readingKey}"`)) {
    updated = updated.replace(
      /  "data\/generated\/batches\/lot-tiaret-zaouias-001\/assisted-readings\.json":/,
      `  "${readingKey}":\n    ${identifier}AssistedReadings as AssistedReadingManifest,\n  "data/generated/batches/lot-tiaret-zaouias-001/assisted-readings.json":`,
    );
  }

  if (updated === raw) {
    console.log(`Registre TS deja a jour pour ${lotId}.`);
    return;
  }

  await writeFile(ARCHIVE_BATCHES_MODULE_PATH, updated, "utf8");
}

async function writeLotAutomationReport(lotId: string, report: unknown) {
  const outputPath = path.join(
    LOCAL_BATCHES_DIRECTORY,
    lotId,
    "reports",
    "wave-automation.json",
  );
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeJson(outputPath, report);
}

async function runVerificationCommands() {
  for (const command of [
    ["npm.cmd", "run", "lint"],
    ["npm.cmd", "run", "build"],
    ["git", "diff", "--check"],
    ["git", "status"],
  ]) {
    await runCommand(command);
  }
}

function resolveTargetBatches(
  config: Config,
  manifest: ArchiveBatchesManifest,
): ArchiveBatch[] {
  const lotIds = config.wave
    ? getLotIdsForWave(config.wave, manifest)
    : config.lots;

  if (lotIds.length === 0) {
    throw new Error("--lots ou --wave doit designer au moins un lot.");
  }

  return lotIds.map((lotId) => {
    const batch = manifest.batches.find((item) => item.lotId === lotId);
    if (!batch) {
      throw new Error(`Lot introuvable dans ${BATCHES_MANIFEST_PATH}: ${lotId}`);
    }
    if (batch.status !== "planned") {
      throw new Error(`Lot non planned refuse: ${lotId} (${batch.status}).`);
    }

    return batch;
  });
}

function getLotIdsForWave(
  wave: string,
  manifest: ArchiveBatchesManifest,
): string[] {
  if (!existsSync(DRIVE_ROOT_INVENTORY_PATH)) {
    throw new Error(`Inventaire local absent: ${DRIVE_ROOT_INVENTORY_PATH}`);
  }

  const inventory = JSON.parse(
    readFileSync(DRIVE_ROOT_INVENTORY_PATH, "utf8"),
  ) as DriveRootInventory;
  const plannedBatches = manifest.batches.filter((batch) => batch.status === "planned");
  const plannedByDriveUrl = new Map(
    plannedBatches
      .filter((batch) => batch.driveSource.driveFolderUrl)
      .map((batch) => [batch.driveSource.driveFolderUrl, batch.lotId]),
  );

  return (inventory.lots ?? [])
    .filter((lot) => lot.priority === wave && lot.matchedLotId)
    .map((lot) => lot.matchedLotId as string)
    .concat(
      (inventory.lots ?? [])
        .filter((lot) => lot.priority === wave)
        .map((lot) =>
          lot.driveFolderUrl ? plannedByDriveUrl.get(lot.driveFolderUrl) : undefined,
        )
        .filter((lotId): lotId is string => Boolean(lotId)),
    )
    .filter((lotId, index, lotIds) => lotIds.indexOf(lotId) === index)
    .sort();
}

function printPlan(config: Config, batches: ArchiveBatch[]) {
  console.log("Automatisation de vague Archives Algerie");
  console.log(`Mode: ${config.dryRun ? "dry-run" : "execution"}`);
  console.log(`Lots cibles (${batches.length}):`);
  for (const batch of batches) {
    console.log(`- ${batch.lotId}: ${batch.title}`);
  }
  console.log("\nCommandes par lot:");
  for (const batch of batches) {
    console.log(
      [
        "npm.cmd",
        "run",
        "batch:agent",
        "--",
        "--lot",
        batch.lotId,
        "--limit",
        String(config.limit),
        "--confirm",
        ...config.skipFlags,
      ].join(" "),
    );
    console.log(`Promote: data/generated/batches/${batch.lotId}/`);
    console.log(`Update: ${BATCHES_MANIFEST_PATH}`);
    console.log(`Update: ${ARCHIVE_BATCHES_MODULE_PATH}`);
  }
}

function printResults(results: LotRunResult[]) {
  console.log("\nResultats:");
  for (const result of results) {
    console.log(
      result.error
        ? `- ${result.lotId}: ${result.status} (${result.error})`
        : `- ${result.lotId}: ${result.status}`,
    );
  }
}

function getConfig(): Config {
  const lotsArg = getArg("--lots");
  const wave = getArg("--wave") ?? null;
  if (lotsArg && wave) {
    throw new Error("--lots et --wave sont exclusifs.");
  }

  const skipFlags = AGENT_SKIP_FLAGS.filter((flag) => process.argv.includes(flag));

  return {
    confirm: process.argv.includes("--confirm"),
    continueOnError: process.argv.includes("--continue-on-error"),
    dryRun: process.argv.includes("--dry-run"),
    limit: getLimit(),
    lots: lotsArg
      ? lotsArg.split(",").map((lotId) => lotId.trim()).filter(Boolean)
      : [],
    skipFlags,
    wave,
  };
}

function requireEnvironment() {
  const missing = REQUIRED_ENVIRONMENT.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(", ")}. Les valeurs ne doivent pas etre commitees.`,
    );
  }
}

function normalizeAssistedReadingStatus(
  value: unknown,
  assistedReadingText: string,
): AssistedReadingStatus {
  if (assistedReadingText.trim().length === 0) {
    return "assisted_unavailable";
  }
  if (value === "assisted_unverified") {
    return value;
  }
  if (value === "assisted_unavailable" || value === "no_text_detected" || value === "unreadable") {
    return "assisted_unavailable";
  }

  throw new Error(`status de lecture assistee invalide: ${String(value)}`);
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function getSafeSourceImage(value: unknown, filePath: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${filePath}: sourceImage requis.`);
  }

  return path.basename(value);
}

function getReviewId(filePath: string, sourceImage: string): string {
  const fileNameMatch = path.basename(filePath).match(/page-(\d+)/i);
  if (fileNameMatch) return `page-${fileNameMatch[1].padStart(2, "0")}`;

  const sourceImageMatch = sourceImage.match(/^(\d+)/);
  if (sourceImageMatch) return `page-${sourceImageMatch[1].padStart(2, "0")}`;

  throw new Error(`${filePath}: impossible de deduire reviewId.`);
}

function buildPromotedNotes(previousNotes: string): string {
  const note =
    "Lot pret pour revue ; images publiees et lectures assistees non validees.";
  if (previousNotes.includes("editorialement sensible")) {
    return `${note} Lot editorialement sensible a controler humainement avec prudence documentaire.`;
  }

  return note;
}

function assertEqual(lotId: string, label: string, expected: number, actual: number) {
  if (expected !== actual) {
    throw new Error(`${lotId}: ${label} incoherent (${expected} attendu, ${actual} trouve).`);
  }
}

async function countFiles(
  directoryPath: string,
  predicate: (fileName: string) => boolean,
): Promise<number> {
  if (!existsSync(directoryPath)) return 0;

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && predicate(entry.name)).length;
}

function runCommand(command: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${command.join(" ")}`);
    const child = spawn(command[0], command.slice(1), {
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Commande echouee (${code}): ${command.join(" ")}`));
    });
  });
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toCamelCase(lotId: string): string {
  return lotId
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`,
    )
    .join("");
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) return 100;

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
