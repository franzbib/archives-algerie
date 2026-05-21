import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
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
  sourceType: string;
  status: ArchiveBatchStatus;
  driveSource: {
    driveFolderUrl: string | null;
    inventoryManifest: string | null;
  };
  itemCount: number | null;
  notes: string;
}

interface ArchiveBatchesManifest {
  batches: ArchiveBatch[];
}

interface AgentConfig {
  confirmed: boolean;
  language: string;
  limit: number;
  lotId: string;
  publishAssetsOnly: boolean;
  skipConversion: boolean;
  skipDownload: boolean;
  skipInventory: boolean;
  skipNormalization: boolean;
  skipOcr: boolean;
  skipUpload: boolean;
  skipVision: boolean;
  workspacePath: string;
}

interface AgentPaths {
  assistedReadingDirectory: string;
  cleanOcrDirectory: string;
  conversionManifestPath: string;
  convertedDirectory: string;
  downloadManifestPath: string;
  inventoryPath: string;
  publicManifestPath: string;
  reportsDirectory: string;
  rawDirectory: string;
  rawOcrDirectory: string;
  sourcesPath: string;
}

interface ConversionManifest {
  convertedAt: string;
  inputDirectory: string;
  outputDirectory: string;
  downloadManifestPath: string;
  fileCount: number;
  warning: string;
  visualControlChecklist: string[];
  files: ConversionManifestFile[];
}

interface ConversionManifestFile {
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  originalFileName: string;
  sourceHeicPath: string;
  convertedJpgPath: string;
  mimeType: string;
  outputMimeType: "image/jpeg";
  sampleOrder: number | null;
  sampleNote: string | null;
  sourceSizeBytes: number;
  convertedSizeBytes: number;
  conversionNote: string;
}

interface DownloadManifest {
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

interface VisionFailure {
  cleanOcrTextFile: string;
  failedAt: string;
  imagePath: string | null;
  reason: string;
  reviewId: string;
  status: "vision_failed_to_retry";
}

interface VisionFailureReport {
  generatedAt: string;
  lotId: string;
  note: string;
  reportType: "assisted-reading-errors";
  failures: VisionFailure[];
}

interface BatchSummaryReport {
  generatedAt: string;
  lotId: string;
  collectionId: string;
  reportType: "batch-summary";
  note: string;
  workspacePath: string;
  reports: {
    downloadErrors: string;
    assistedReadingErrors: string;
  };
  counts: {
    rawFiles: number;
    convertedImages: number;
    cleanOcrFiles: number;
    assistedReadingFiles: number;
    downloadSkippedFiles: number;
    assistedReadingFailures: number;
  };
  status: {
    publicManifestExists: boolean;
    conversionManifestExists: boolean;
    downloadManifestExists: boolean;
  };
  resumeHints: string[];
}

interface DownloadErrorReport {
  skippedFiles?: unknown[];
}

const BATCHES_MANIFEST_PATH = "data/generated/archive-batches.example.json";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".heic", ".heif"]);
const JPG_EXTENSIONS = new Set([".jpg", ".jpeg"]);
const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);
const PDF_EXTENSIONS = new Set([".pdf"]);

async function main() {
  const config = getConfig();

  if (!config.confirmed) {
    throw new Error(
      "Agent refuse: ajoutez --confirm pour confirmer les ecritures locales et les appels externes configures.",
    );
  }

  const batch = await getArchiveBatch(config.lotId);
  const paths = getAgentPaths(config);

  printIntro(config, batch, paths);
  await mkdir(config.workspacePath, { recursive: true });

  if (!config.skipInventory) {
    await runStep("1. Inventaire Drive du lot", async () => {
      if (!batch.driveSource.driveFolderUrl) {
        throw new Error(
          `Le lot ${batch.lotId} ne possede pas encore de driveSource.driveFolderUrl. Inventaire impossible sans source controlee.`,
        );
      }

      await writeDriveSourcesFile(batch, paths.sourcesPath);
      await runTsx([
        "scripts/drive-inventory.ts",
        "--sources",
        paths.sourcesPath,
        "--out",
        paths.inventoryPath,
        "--limit",
        String(config.limit),
      ]);
    });
  } else {
    printSkipped("1. Inventaire Drive du lot");
  }

  if (!config.skipDownload) {
    await runStep("2. Telechargement local brut", async () => {
      await runTsx([
        "scripts/download-drive-sample.ts",
        "--inventory",
        paths.inventoryPath,
        "--out",
        paths.rawDirectory,
        "--limit",
        String(config.limit),
        "--lot-id",
        batch.lotId,
        "--mode",
        "batch",
        "--confirm",
      ]);
    });
  } else {
    printSkipped("2. Telechargement local brut");
  }

  if (!config.skipConversion) {
    await runStep("3. Copie ou conversion JPG", async () => {
      await prepareConvertedImages(paths, config.limit);
    });
  } else {
    printSkipped("3. Copie ou conversion JPG");
  }

  if (!config.skipOcr) {
    await runStep("4. OCR brut", async () => {
      await runTsx([
        "scripts/ocr-sample.ts",
        "--input",
        paths.convertedDirectory,
        "--out",
        paths.rawOcrDirectory,
        "--lang",
        config.language,
        "--confirm",
      ]);
    });
  } else {
    printSkipped("4. OCR brut");
  }

  if (!config.skipNormalization) {
    await runStep("5. OCR nettoye mecaniquement", async () => {
      await runTsx([
        "scripts/normalize-ocr-sample.ts",
        "--input",
        paths.rawOcrDirectory,
        "--out",
        paths.cleanOcrDirectory,
        "--confirm",
      ]);
    });
  } else {
    printSkipped("5. OCR nettoye mecaniquement");
  }

  if (!config.skipVision) {
    await runStep("6. Lectures assistees vision", async () => {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY est requise pour la lecture assistee vision. Utilisez --skip-vision pour ignorer cette etape.",
        );
      }

      await generateVisionReadings(config, paths);
    });
  } else {
    printSkipped("6. Lectures assistees vision");
  }

  if (!config.skipUpload) {
    await runStep("7. Upload R2 et manifeste public local", async () => {
      requireR2Environment();
      await runTsx([
        "scripts/upload-pilot-assets-r2.ts",
        "--input",
        paths.convertedDirectory,
        "--manifest",
        paths.conversionManifestPath,
        "--out",
        paths.publicManifestPath,
        "--prefix",
        `batches/${batch.lotId}/images`,
        "--collection-id",
        batch.collectionId,
        "--limit",
        String(config.limit),
        "--confirm",
      ]);
    });
  } else {
    printSkipped("7. Upload R2 et manifeste public local");
  }

  console.log("\nAgent de lot termine.");
  await writeBatchSummary(config, batch, paths);
  console.log("Sorties locales uniquement: aucun manifeste principal modifie.");
  console.log("Les lectures assistees restent non validees jusqu'a relecture humaine.");
}

async function prepareConvertedImages(paths: AgentPaths, limit: number) {
  await requireDirectory(paths.rawDirectory, "dossier raw du lot");
  const rawFiles = await listFiles(paths.rawDirectory);
  const heicFiles = rawFiles.filter((filePath) =>
    HEIC_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );
  const jpgFiles = rawFiles.filter((filePath) =>
    JPG_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );
  const pdfFiles = rawFiles.filter((filePath) =>
    PDF_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );

  if (heicFiles.length === 0 && jpgFiles.length === 0 && pdfFiles.length === 0) {
    throw new Error(`Aucun fichier HEIC/JPG/PDF trouve dans ${paths.rawDirectory}.`);
  }

  if (pdfFiles.length > 0 && (heicFiles.length > 0 || jpgFiles.length > 0)) {
    throw new Error(
      "Lot mixte PDF/images detecte. Separez les PDF et les images dans deux lots pour eviter de melanger les sequences de pages.",
    );
  }

  if (pdfFiles.length > 0) {
    await runTsx([
      "scripts/convert-pdf-batch-to-jpg.ts",
      "--input",
      paths.rawDirectory,
      "--out",
      paths.convertedDirectory,
      "--manifest",
      paths.downloadManifestPath,
      "--limit",
      String(limit),
      "--confirm",
    ]);
    return;
  }

  if (heicFiles.length > 0) {
    await runTsx([
      "scripts/convert-sample-heic.ts",
      "--input",
      paths.rawDirectory,
      "--out",
      paths.convertedDirectory,
      "--manifest",
      paths.downloadManifestPath,
      "--confirm",
    ]);
  } else {
    await mkdir(paths.convertedDirectory, { recursive: true });
  }

  const copiedFiles: ConversionManifestFile[] = [];
  const downloadManifest = existsSync(paths.downloadManifestPath)
    ? await readJson<DownloadManifest>(paths.downloadManifestPath)
    : null;

  for (const jpgFile of jpgFiles) {
    const targetPath = path.join(paths.convertedDirectory, path.basename(jpgFile));
    await copyFile(jpgFile, targetPath);
    const sourceStat = await stat(jpgFile);
    const targetStat = await stat(targetPath);
    const sourceMetadata = findDownloadedFileMetadata(downloadManifest, jpgFile);

    copiedFiles.push({
      collectionId: sourceMetadata?.collectionId ?? "",
      driveFileId: sourceMetadata?.driveFileId ?? "",
      driveUrl: sourceMetadata?.driveUrl ?? "",
      originalFileName: sourceMetadata?.fileName ?? path.basename(jpgFile),
      sourceHeicPath: jpgFile,
      convertedJpgPath: targetPath,
      mimeType: sourceMetadata?.mimeType ?? "image/jpeg",
      outputMimeType: "image/jpeg",
      sampleOrder: sourceMetadata?.sampleOrder ?? inferOrderFromFileName(jpgFile),
      sampleNote: sourceMetadata?.sampleNote ?? null,
      sourceSizeBytes: sourceStat.size,
      convertedSizeBytes: targetStat.size,
      conversionNote:
        "Copie locale JPG vers le dossier converted ; aucune OCR, aucune validation documentaire.",
    });
    console.log(`Copied JPG ${jpgFile} -> ${targetPath}`);
  }

  if (copiedFiles.length > 0 || !existsSync(paths.conversionManifestPath)) {
    await mergeCopiedJpgsIntoConversionManifest(paths, copiedFiles);
  }
}

function findDownloadedFileMetadata(
  downloadManifest: DownloadManifest | null,
  filePath: string,
): DownloadManifestFile | null {
  if (!downloadManifest) return null;

  const fileName = path.basename(filePath).toLocaleLowerCase("fr");
  return (
    downloadManifest.files.find(
      (file) =>
        path.basename(file.localPath).toLocaleLowerCase("fr") === fileName ||
        file.fileName.toLocaleLowerCase("fr") === fileName,
    ) ?? null
  );
}

async function mergeCopiedJpgsIntoConversionManifest(
  paths: AgentPaths,
  copiedFiles: ConversionManifestFile[],
) {
  const existingManifest = existsSync(paths.conversionManifestPath)
    ? await readJson<ConversionManifest>(paths.conversionManifestPath)
    : createEmptyConversionManifest(paths);
  const existingOutputPaths = new Set(
    existingManifest.files.map((file) => toPortablePath(file.convertedJpgPath)),
  );
  const mergedFiles = [
    ...existingManifest.files,
    ...copiedFiles.filter(
      (file) => !existingOutputPaths.has(toPortablePath(file.convertedJpgPath)),
    ),
  ].sort((a, b) => a.convertedJpgPath.localeCompare(b.convertedJpgPath));
  const manifest: ConversionManifest = {
    ...existingManifest,
    fileCount: mergedFiles.length,
    files: mergedFiles,
  };

  await mkdir(path.dirname(paths.conversionManifestPath), { recursive: true });
  await writeFile(
    paths.conversionManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`Conversion manifest ready: ${paths.conversionManifestPath}`);
}

async function generateVisionReadings(config: AgentConfig, paths: AgentPaths) {
  await requireDirectory(paths.cleanOcrDirectory, "dossier OCR clean du lot");
  await requireDirectory(paths.convertedDirectory, "dossier converted du lot");
  const cleanTextFiles = (await listFiles(paths.cleanOcrDirectory)).filter(
    (filePath) => path.extname(filePath).toLowerCase() === ".txt",
  );

  if (cleanTextFiles.length === 0) {
    throw new Error(`Aucun OCR nettoye trouve dans ${paths.cleanOcrDirectory}.`);
  }

  await mkdir(paths.assistedReadingDirectory, { recursive: true });
  const failures: VisionFailure[] = [];

  for (const cleanTextFile of cleanTextFiles.slice(0, config.limit)) {
    const imagePath = findMatchingJpg(cleanTextFile, paths.convertedDirectory);
    const reviewId = toReviewId(cleanTextFile);

    if (!imagePath) {
      failures.push({
        cleanOcrTextFile: cleanTextFile,
        failedAt: new Date().toISOString(),
        imagePath: null,
        reason: `Image JPG correspondante introuvable dans ${paths.convertedDirectory}.`,
        reviewId,
        status: "vision_failed_to_retry",
      });
      await writeVisionFailureReport(config, paths, failures);
      console.warn(`[VISION WARNING] ${reviewId}: image JPG introuvable. Page a reprendre.`);
      continue;
    }

    const outputPath = path.join(
      paths.assistedReadingDirectory,
      `${reviewId}.vision.assisted.json`,
    );

    try {
      await runTsx([
        "scripts/generate-assisted-reading-vision.ts",
        "--workspace",
        path.dirname(paths.assistedReadingDirectory),
        "--input",
        cleanTextFile,
        "--image",
        imagePath,
        "--out",
        outputPath,
        "--confirm",
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({
        cleanOcrTextFile: cleanTextFile,
        failedAt: new Date().toISOString(),
        imagePath,
        reason,
        reviewId,
        status: "vision_failed_to_retry",
      });
      await writeVisionFailureReport(config, paths, failures);
      console.warn(
        `[VISION WARNING] ${reviewId}: lecture assistee vision echouee. Page a reprendre. ${reason}`,
      );
    }
  }

  if (failures.length > 0) {
    console.warn(
      `[VISION WARNING] ${failures.length} page(s) en echec. L'agent continue vers les etapes suivantes.`,
    );
    console.warn(
      `Rapport local: ${getVisionFailureReportPath(paths)}`,
    );
  }
}

async function writeVisionFailureReport(
  config: AgentConfig,
  paths: AgentPaths,
  failures: VisionFailure[],
) {
  const report: VisionFailureReport = {
    failures,
    generatedAt: new Date().toISOString(),
    lotId: config.lotId,
    note:
      "Rapport local des lectures assistees vision echouees. Aucune lecture n'a ete inventee ; ces pages doivent etre reprises plus tard.",
    reportType: "assisted-reading-errors",
  };

  await mkdir(path.dirname(getVisionFailureReportPath(paths)), { recursive: true });
  await writeFile(
    getVisionFailureReportPath(paths),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
}

function getVisionFailureReportPath(paths: AgentPaths): string {
  return path.join(paths.reportsDirectory, "assisted-reading-errors.json");
}

function getAgentPaths(config: AgentConfig): AgentPaths {
  const reportsDirectory = path.join(config.workspacePath, "reports");

  return {
    assistedReadingDirectory: path.join(
      config.workspacePath,
      "assisted-reading-vision",
    ),
    cleanOcrDirectory: path.join(config.workspacePath, "ocr", "clean"),
    conversionManifestPath: path.join(config.workspacePath, "conversion-manifest.json"),
    convertedDirectory: path.join(config.workspacePath, "converted"),
    downloadManifestPath: path.join(config.workspacePath, "download-manifest.json"),
    inventoryPath: path.join(config.workspacePath, "drive-inventory.json"),
    publicManifestPath: path.join(config.workspacePath, "public", "public-assets.json"),
    reportsDirectory,
    rawDirectory: path.join(config.workspacePath, "raw"),
    rawOcrDirectory: path.join(config.workspacePath, "ocr", "raw"),
    sourcesPath: path.join(config.workspacePath, "drive-sources.json"),
  };
}

async function getArchiveBatch(lotId: string): Promise<ArchiveBatch> {
  const manifest = await readJson<ArchiveBatchesManifest>(BATCHES_MANIFEST_PATH);
  const batch = manifest.batches.find((item) => item.lotId === lotId);
  if (!batch) {
    throw new Error(`Lot introuvable dans ${BATCHES_MANIFEST_PATH}: ${lotId}`);
  }

  return batch;
}

async function writeDriveSourcesFile(batch: ArchiveBatch, outputPath: string) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      [
        {
          collectionId: batch.collectionId,
          title: batch.title,
          driveUrl: batch.driveSource.driveFolderUrl,
          notes:
            "Source generee localement par l'agent de lot ; inventaire brut uniquement.",
          status: "to_inventory",
        },
      ],
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`Drive sources written: ${outputPath}`);
}

async function runStep(name: string, task: () => Promise<void>) {
  console.log(`\n[RUN] ${name}`);
  try {
    await task();
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

function printSkipped(name: string) {
  console.log(`\n[SKIP] ${name}`);
}

function runTsx(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const childArgs = ["tsx", ...args];
    const displayArgs = [command, ...childArgs].map(quoteShellArg).join(" ");
    console.log(displayArgs);
    const child = process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", displayArgs], {
          env: process.env,
          shell: false,
          stdio: "inherit",
          windowsHide: false,
        })
      : spawn(command, childArgs, {
      env: process.env,
      shell: false,
      stdio: "inherit",
      windowsHide: false,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Etape echouee avec le code ${code}. Agent interrompu.`));
    });
  });
}

function quoteShellArg(arg: string): string {
  if (!/[\s"'&()^<>|]/.test(arg)) return arg;

  return `"${arg.replace(/"/g, '\\"')}"`;
}

async function requireDirectory(directoryPath: string, label: string) {
  if (!existsSync(directoryPath)) {
    throw new Error(`${label} absent: ${directoryPath}`);
  }

  const directoryStat = await stat(directoryPath);
  if (!directoryStat.isDirectory()) {
    throw new Error(`${label} n'est pas un dossier: ${directoryPath}`);
  }
}

function requireR2Environment() {
  for (const name of [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ]) {
    if (!process.env[name]) {
      throw new Error(
        `${name} est requise pour l'upload R2. Utilisez --skip-upload pour ignorer cette etape.`,
      );
    }
  }
}

async function listFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(directoryPath, entry.name))
    .filter((filePath) => {
      const extension = path.extname(filePath).toLowerCase();
      return (
        IMAGE_EXTENSIONS.has(extension) ||
        PDF_EXTENSIONS.has(extension) ||
        extension === ".txt"
      );
    })
    .sort();
}

function findMatchingJpg(cleanTextFile: string, convertedDirectory: string): string | null {
  const baseName = path.basename(cleanTextFile, ".txt").replace(/\.clean$/i, "");
  for (const extension of [".jpg", ".jpeg"]) {
    const candidate = path.join(convertedDirectory, `${baseName}${extension}`);
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

function toReviewId(filePath: string): string {
  const order = inferOrderFromFileName(filePath);
  if (order) return `page-${String(order).padStart(2, "0")}`;

  return path
    .basename(filePath, ".txt")
    .replace(/\.clean$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .toLowerCase();
}

function inferOrderFromFileName(filePath: string): number | null {
  const match = path.basename(filePath).match(/^(\d{1,4})[-_]/);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function createEmptyConversionManifest(paths: AgentPaths): ConversionManifest {
  return {
    convertedAt: new Date().toISOString(),
    inputDirectory: paths.rawDirectory,
    outputDirectory: paths.convertedDirectory,
    downloadManifestPath: paths.downloadManifestPath,
    fileCount: 0,
    warning:
      "Preparation technique locale: les JPG ne sont pas des pages ou documents valides.",
    visualControlChecklist: [
      "Lisibilite",
      "Orientation",
      "Doublons",
      "Pages floues",
      "Ordre probable",
      "Debut et fin de document",
    ],
    files: [],
  };
}

function printIntro(config: AgentConfig, batch: ArchiveBatch, paths: AgentPaths) {
  console.log("Agent local de traitement de lot - Archives Algerie");
  console.log(`Lot: ${batch.lotId}`);
  console.log(`Collection: ${batch.collectionId}`);
  console.log(`Titre: ${batch.title}`);
  console.log(`Statut registre: ${batch.status}`);
  console.log(`Workspace: ${config.workspacePath}`);
  console.log(`Inventaire local: ${paths.inventoryPath}`);
  console.log(`Limite: ${config.limit}`);
  console.log(`Langue OCR: ${config.language}`);
  if (config.publishAssetsOnly) {
    console.log("Mode reprise: publication des assets uniquement.");
  }
  console.log("Aucune promotion automatique vers data/generated.");
  console.log(
    "Aucune modification de Drive, R2 ou du manifeste principal hors etapes explicitement configurees.",
  );
}

function getConfig(): AgentConfig {
  const lotId = getArg("--lot");
  if (!lotId) {
    throw new Error("--lot est requis.");
  }

  const publishAssetsOnly = process.argv.includes("--publish-assets-only");
  if (publishAssetsOnly && process.argv.includes("--skip-upload")) {
    throw new Error("--publish-assets-only ne peut pas etre combine avec --skip-upload.");
  }

  return {
    confirmed: process.argv.includes("--confirm"),
    language: getArg("--lang") ?? "fra",
    limit: getLimit(),
    lotId,
    publishAssetsOnly,
    skipConversion: publishAssetsOnly || process.argv.includes("--skip-conversion"),
    skipDownload: publishAssetsOnly || process.argv.includes("--skip-download"),
    skipInventory: publishAssetsOnly || process.argv.includes("--skip-inventory"),
    skipNormalization:
      publishAssetsOnly || process.argv.includes("--skip-normalization"),
    skipOcr: publishAssetsOnly || process.argv.includes("--skip-ocr"),
    skipUpload: process.argv.includes("--skip-upload"),
    skipVision: publishAssetsOnly || process.argv.includes("--skip-vision"),
    workspacePath:
      getArg("--workspace") ?? path.join(".local", "archive-batches", lotId),
  };
}

async function writeBatchSummary(
  config: AgentConfig,
  batch: ArchiveBatch,
  paths: AgentPaths,
) {
  const downloadErrors = await readOptionalJson<DownloadErrorReport>(
    getDownloadErrorReportPath(paths),
  );
  const assistedReadingErrors = await readOptionalJson<VisionFailureReport>(
    getVisionFailureReportPath(paths),
  );
  const downloadSkippedFiles = downloadErrors?.skippedFiles?.length ?? 0;
  const assistedReadingFailures = assistedReadingErrors?.failures?.length ?? 0;
  const summary: BatchSummaryReport = {
    collectionId: batch.collectionId,
    counts: {
      assistedReadingFailures,
      assistedReadingFiles: await countFilesWithExtension(
        paths.assistedReadingDirectory,
        ".json",
        (fileName) => fileName.endsWith(".vision.assisted.json"),
      ),
      cleanOcrFiles: await countFilesWithExtension(paths.cleanOcrDirectory, ".txt"),
      convertedImages: await countFilesWithExtension(
        paths.convertedDirectory,
        [".jpg", ".jpeg"],
      ),
      downloadSkippedFiles,
      rawFiles: await countFiles(paths.rawDirectory),
    },
    generatedAt: new Date().toISOString(),
    lotId: config.lotId,
    note:
      "Resume local du lot. Les images publiees, OCR et lectures assistees restent des etats techniques distincts ; aucune lecture assistee n'est une transcription validee.",
    reportType: "batch-summary",
    reports: {
      assistedReadingErrors: getVisionFailureReportPath(paths),
      downloadErrors: getDownloadErrorReportPath(paths),
    },
    resumeHints: buildResumeHints(config.lotId, downloadSkippedFiles, assistedReadingFailures),
    status: {
      conversionManifestExists: existsSync(paths.conversionManifestPath),
      downloadManifestExists: existsSync(paths.downloadManifestPath),
      publicManifestExists: existsSync(paths.publicManifestPath),
    },
    workspacePath: config.workspacePath,
  };

  await mkdir(paths.reportsDirectory, { recursive: true });
  await writeFile(
    getBatchSummaryReportPath(paths),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(`Rapport local de synthese: ${getBatchSummaryReportPath(paths)}`);
}

function getDownloadErrorReportPath(paths: AgentPaths): string {
  return path.join(paths.reportsDirectory, "download-errors.json");
}

function getBatchSummaryReportPath(paths: AgentPaths): string {
  return path.join(paths.reportsDirectory, "batch-summary.json");
}

function buildResumeHints(
  lotId: string,
  downloadSkippedFiles: number,
  assistedReadingFailures: number,
): string[] {
  const hints = [
    `npm.cmd run batch:agent -- --lot ${lotId} --publish-assets-only --limit 100 --confirm`,
  ];

  if (downloadSkippedFiles > 0) {
    hints.push(
      `npm.cmd run batch:agent -- --lot ${lotId} --skip-inventory --limit 100 --confirm`,
    );
  }

  if (assistedReadingFailures > 0) {
    hints.push(
      `npx.cmd tsx scripts/promote-assisted-readings.ts --input .local/archive-batches/${lotId}/assisted-reading-vision --out data/generated/batches/${lotId}/assisted-readings.json --skip-invalid`,
    );
  }

  return hints;
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return 100;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function readOptionalJson<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null;

  return readJson<T>(filePath);
}

async function countFiles(directoryPath: string): Promise<number> {
  if (!existsSync(directoryPath)) return 0;

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).length;
}

async function countFilesWithExtension(
  directoryPath: string,
  extension: string | string[],
  predicate?: (fileName: string) => boolean,
): Promise<number> {
  if (!existsSync(directoryPath)) return 0;

  const extensions = new Set(Array.isArray(extension) ? extension : [extension]);
  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => {
    if (!entry.isFile()) return false;
    if (!extensions.has(path.extname(entry.name).toLowerCase())) return false;

    return predicate ? predicate(entry.name) : true;
  }).length;
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
