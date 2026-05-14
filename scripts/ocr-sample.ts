import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

interface OcrManifest {
  generatedAt: string;
  inputDirectory: string;
  outputDirectory: string;
  lang: string;
  fileCount: number;
  warning: string;
  files: OcrManifestItem[];
}

interface OcrManifestItem {
  sourceImage: string;
  outputTextFile: string;
  lang: string;
  status: "ocr_raw";
  note: "OCR brut produit localement ; non relu.";
}

const DEFAULT_INPUT_DIRECTORY = ".local/archive-sample/converted";
const DEFAULT_OUTPUT_DIRECTORY = ".local/archive-sample/ocr/raw";
const DEFAULT_LANGUAGE = "fra";
const JPG_EXTENSIONS = new Set([".jpg", ".jpeg"]);

async function main() {
  const inputDirectory = getArg("--input") ?? DEFAULT_INPUT_DIRECTORY;
  const outputDirectory = getArg("--out") ?? DEFAULT_OUTPUT_DIRECTORY;
  const language = getArg("--lang") ?? DEFAULT_LANGUAGE;
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    throw new Error("OCR refuse: ajoutez --confirm pour confirmer l'ecriture locale.");
  }

  await requireDirectory(inputDirectory, "dossier converted");
  await requireTesseract();

  const images = await listJpgFiles(inputDirectory);
  if (images.length === 0) {
    throw new Error(`Aucun fichier JPG trouve dans ${inputDirectory}.`);
  }

  await mkdir(outputDirectory, { recursive: true });

  const files: OcrManifestItem[] = [];

  for (const imagePath of images) {
    const outputBase = path.join(
      outputDirectory,
      path.basename(imagePath, path.extname(imagePath)),
    );
    const outputTextFile = `${outputBase}.txt`;

    await runCommand("tesseract", [imagePath, outputBase, "-l", language]);

    files.push({
      sourceImage: imagePath,
      outputTextFile,
      lang: language,
      status: "ocr_raw",
      note: "OCR brut produit localement ; non relu.",
    });

    console.log(`OCR raw ${imagePath} -> ${outputTextFile}`);
  }

  const manifest: OcrManifest = {
    generatedAt: new Date().toISOString(),
    inputDirectory,
    outputDirectory,
    lang: language,
    fileCount: files.length,
    warning:
      "OCR brut local: texte non relu, non corrige, non indexe et non valide comme transcription.",
    files,
  };

  const manifestPath = path.join(path.dirname(outputDirectory), "ocr-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`OCR manifest written: ${manifestPath}`);
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

async function requireTesseract() {
  try {
    await runCommand("tesseract", ["--version"]);
  } catch (error) {
    throw new Error(
      "Tesseract n'est pas disponible. Installez Tesseract OCR et verifiez que la commande `tesseract` est dans le PATH. " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

async function listJpgFiles(inputDirectory: string): Promise<string[]> {
  const entries = await readdir(inputDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(inputDirectory, entry.name))
    .filter((filePath) => JPG_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .sort();
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
