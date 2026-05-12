import { spawn } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type OcrStatus = "done" | "failed";

interface OcrMetadata {
  inputDir: string;
  outputDir: string;
  language: string;
  generatedAt: string;
  items: OcrMetadataItem[];
}

interface OcrMetadataItem {
  sourceFile: string;
  outputTextFile?: string;
  status: OcrStatus;
  error?: string;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const PDF_EXTENSION = ".pdf";

async function main() {
  const inputDir = getArg("--input");
  if (!inputDir) {
    throw new Error("Usage: npm run ocr:local -- --input <dossier> [--out <dossier>] [--lang fra+ara]");
  }

  const outputDir = getArg("--out") ?? path.join(inputDir, "ocr-output");
  const language = getArg("--lang") ?? "fra";
  const tempDir = path.join(outputDir, ".tmp");

  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });

  const files = await listSupportedFiles(inputDir);
  const items: OcrMetadataItem[] = [];

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();

    if (extension === PDF_EXTENSION) {
      items.push(...(await ocrPdf(file, outputDir, tempDir, language)));
      continue;
    }

    items.push(await ocrImage(file, outputDir, language));
  }

  const metadata: OcrMetadata = {
    inputDir,
    outputDir,
    language,
    generatedAt: new Date().toISOString(),
    items,
  };

  await writeFile(
    path.join(outputDir, "ocr-metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
  await rm(tempDir, { recursive: true, force: true });

  console.log(`OCR finished: ${outputDir}`);
  console.log(`Files processed: ${items.length}`);
}

async function ocrImage(
  imagePath: string,
  outputDir: string,
  language: string,
): Promise<OcrMetadataItem> {
  const baseName = path.basename(imagePath, path.extname(imagePath));
  const outputBase = path.join(outputDir, baseName);
  const outputTextFile = `${outputBase}.txt`;

  try {
    await runCommand("tesseract", [imagePath, outputBase, "-l", language]);
    return {
      sourceFile: imagePath,
      outputTextFile,
      status: "done",
    };
  } catch (error) {
    return {
      sourceFile: imagePath,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function ocrPdf(
  pdfPath: string,
  outputDir: string,
  tempDir: string,
  language: string,
): Promise<OcrMetadataItem[]> {
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const pagePrefix = path.join(tempDir, baseName);

  try {
    await runCommand("pdftoppm", ["-png", pdfPath, pagePrefix]);
  } catch (error) {
    return [
      {
        sourceFile: pdfPath,
        status: "failed",
        error:
          "PDF conversion failed. Install `pdftoppm` from Poppler to OCR PDF files. " +
          (error instanceof Error ? error.message : String(error)),
      },
    ];
  }

  const pages = (await readdir(tempDir))
    .filter((file) => file.startsWith(baseName) && file.endsWith(".png"))
    .map((file) => path.join(tempDir, file))
    .sort();

  const results: OcrMetadataItem[] = [];
  for (const page of pages) {
    const pageName = path.basename(page, ".png");
    const outputBase = path.join(outputDir, pageName);

    try {
      await runCommand("tesseract", [page, outputBase, "-l", language]);
      results.push({
        sourceFile: `${pdfPath}#${pageName}`,
        outputTextFile: `${outputBase}.txt`,
        status: "done",
      });
    } catch (error) {
      results.push({
        sourceFile: `${pdfPath}#${pageName}`,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function listSupportedFiles(inputDir: string): Promise<string[]> {
  const entries = await readdir(inputDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(inputDir, entry.name))
    .filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.has(extension) || extension === PDF_EXTENSION;
    })
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
