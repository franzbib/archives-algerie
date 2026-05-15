import { spawn } from "node:child_process";
import path from "node:path";

interface PipelineConfig {
  confirmed: boolean;
  inventoryPath: string;
  language: string;
  limit: number;
  mode: "sample" | "batch";
  skipConversion: boolean;
  skipDownload: boolean;
  skipInventory: boolean;
  skipNormalization: boolean;
  skipOcr: boolean;
  sourcesPath: string;
  workspacePath: string;
}

interface PipelineStep {
  args: string[];
  name: string;
  skipped: boolean;
}

async function main() {
  const config = getConfig();

  if (!config.confirmed) {
    throw new Error(
      "Pipeline refuse: ajoutez --confirm pour confirmer les ecritures locales.",
    );
  }

  printIntro(config);

  const rawDirectory = path.join(config.workspacePath, "raw");
  const convertedDirectory = path.join(config.workspacePath, "converted");
  const downloadManifestPath = path.join(
    config.workspacePath,
    "download-manifest.json",
  );
  const ocrRawDirectory = path.join(config.workspacePath, "ocr", "raw");
  const ocrCleanDirectory = path.join(config.workspacePath, "ocr", "clean");

  const steps: PipelineStep[] = [
    {
      name: "1. Inventaire Drive",
      skipped: config.skipInventory,
      args: [
        "scripts/drive-inventory.ts",
        "--sources",
        config.sourcesPath,
        "--out",
        config.inventoryPath,
        "--limit",
        String(config.limit),
      ],
    },
    {
      name:
        config.mode === "sample"
          ? "2. Telechargement de l'echantillon"
          : "2. Telechargement du lot pilote complet",
      skipped: config.skipDownload,
      args: [
        "scripts/download-drive-sample.ts",
        "--inventory",
        config.inventoryPath,
        "--out",
        rawDirectory,
        "--limit",
        String(config.limit),
        "--mode",
        config.mode,
        "--confirm",
      ],
    },
    {
      name: "3. Conversion HEIC vers JPG",
      skipped: config.skipConversion,
      args: [
        "scripts/convert-sample-heic.ts",
        "--input",
        rawDirectory,
        "--out",
        convertedDirectory,
        "--manifest",
        downloadManifestPath,
        "--confirm",
      ],
    },
    {
      name: "4. OCR brut local",
      skipped: config.skipOcr,
      args: [
        "scripts/ocr-sample.ts",
        "--input",
        convertedDirectory,
        "--out",
        ocrRawDirectory,
        "--lang",
        config.language,
        "--confirm",
      ],
    },
    {
      name: "5. Normalisation mecanique OCR",
      skipped: config.skipNormalization,
      args: [
        "scripts/normalize-ocr-sample.ts",
        "--input",
        ocrRawDirectory,
        "--out",
        ocrCleanDirectory,
        "--confirm",
      ],
    },
  ];

  for (const step of steps) {
    if (step.skipped) {
      console.log(`\n[SKIP] ${step.name}`);
      continue;
    }

    console.log(`\n[RUN] ${step.name}`);
    console.log(`npx tsx ${step.args.join(" ")}`);
    await runTsx(step.args);
  }

  console.log("\nPipeline pilote termine.");
  console.log(
    "Rappel: aucun appel IA, aucun embedding, aucune validation de transcription.",
  );
}

function getConfig(): PipelineConfig {
  return {
    confirmed: process.argv.includes("--confirm"),
    inventoryPath: getArg("--inventory") ?? "data/generated/drive-inventory.pilot.json",
    language: getArg("--lang") ?? "fra",
    mode: getMode(),
    limit: getLimit(),
    skipConversion: process.argv.includes("--skip-conversion"),
    skipDownload: process.argv.includes("--skip-download"),
    skipInventory: process.argv.includes("--skip-inventory"),
    skipNormalization: process.argv.includes("--skip-normalization"),
    skipOcr: process.argv.includes("--skip-ocr"),
    sourcesPath: getArg("--sources") ?? "scripts/drive-sources.pilot.example.json",
    workspacePath: getArg("--workspace") ?? ".local/archive-sample",
  };
}

function printIntro(config: PipelineConfig) {
  console.log("Pipeline pilote local Archives Algerie");
  console.log(`Sources: ${config.sourcesPath}`);
  console.log(`Inventaire: ${config.inventoryPath}`);
  console.log(`Workspace local: ${config.workspacePath}`);
  console.log(`Mode: ${config.mode}`);
  console.log(`Limite: ${config.limit}`);
  console.log(`Langue OCR: ${config.language}`);
  console.log("Ce pipeline ne lance aucune IA et ne cree aucun embedding.");
  console.log("Il ne modifie pas Google Drive ni le manifeste principal.");
}

function runTsx(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(command, ["tsx", ...args], {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Etape echouee avec le code ${code}. Pipeline interrompu.`));
    });
  });
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return getMode() === "sample" ? 8 : 41;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

function getMode(): "sample" | "batch" {
  const mode = getArg("--mode") ?? "sample";
  if (mode !== "sample" && mode !== "batch") {
    throw new Error('--mode doit etre "sample" ou "batch".');
  }

  return mode;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
