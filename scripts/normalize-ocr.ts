import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface NormalizedTextFile {
  sourceFile: string;
  rawTextFile: string;
  cleanTextFile: string;
  metadataFile: string;
}

interface NormalizedTextMetadata {
  sourceFile: string;
  rawTextFile: string;
  cleanTextFile: string;
  generatedAt: string;
  rawLength: number;
  cleanLength: number;
}

async function main() {
  const inputDir = getArg("--input");
  if (!inputDir) {
    throw new Error("Usage: npm run ocr:normalize -- --input <dossier> [--out <dossier>]");
  }

  const outputDir = getArg("--out") ?? path.join(inputDir, "normalized");
  await mkdir(outputDir, { recursive: true });

  const textFiles = (await readdir(inputDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => path.join(inputDir, entry.name))
    .sort();

  const normalizedFiles: NormalizedTextFile[] = [];

  for (const textFile of textFiles) {
    const rawText = await readFile(textFile, "utf8");
    const cleanText = normalizeOcrText(rawText);
    const baseName = path.basename(textFile, ".txt");
    const rawTextFile = path.join(outputDir, `${baseName}.raw.txt`);
    const cleanTextFile = path.join(outputDir, `${baseName}.clean.txt`);
    const metadataFile = path.join(outputDir, `${baseName}.metadata.json`);

    await writeFile(rawTextFile, rawText, "utf8");
    await writeFile(cleanTextFile, cleanText, "utf8");
    await writeFile(
      metadataFile,
      `${JSON.stringify(
        {
          sourceFile: textFile,
          rawTextFile,
          cleanTextFile,
          generatedAt: new Date().toISOString(),
          rawLength: rawText.length,
          cleanLength: cleanText.length,
        } satisfies NormalizedTextMetadata,
        null,
        2,
      )}\n`,
      "utf8",
    );

    normalizedFiles.push({
      sourceFile: textFile,
      rawTextFile,
      cleanTextFile,
      metadataFile,
    });
  }

  await writeFile(
    path.join(outputDir, "normalized-index.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), files: normalizedFiles }, null, 2)}\n`,
    "utf8",
  );

  console.log(`OCR normalization finished: ${outputDir}`);
  console.log(`Files normalized: ${normalizedFiles.length}`);
}

function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
