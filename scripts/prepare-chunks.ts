import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface PreparedChunk {
  id: string;
  sourceFile: string;
  chunkIndex: number;
  text: string;
  characterCount: number;
}

interface ChunkIndex {
  generatedAt: string;
  chunkSize: number;
  overlap: number;
  chunks: PreparedChunk[];
}

async function main() {
  const inputDir = getArg("--input");
  if (!inputDir) {
    throw new Error("Usage: npm run chunks:prepare -- --input <dossier> [--out <fichier>] [--size 900] [--overlap 120]");
  }

  const outputFile = getArg("--out") ?? path.join(inputDir, "chunks.json");
  const chunkSize = parsePositiveInt(getArg("--size"), 900);
  const overlap = parsePositiveInt(getArg("--overlap"), 120);

  if (overlap >= chunkSize) {
    throw new Error("`--overlap` doit etre inferieur a `--size`.");
  }

  const textFiles = (await readdir(inputDir, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".txt") &&
        !entry.name.endsWith(".raw.txt"),
    )
    .map((entry) => path.join(inputDir, entry.name))
    .sort();

  const chunks: PreparedChunk[] = [];

  for (const textFile of textFiles) {
    const text = await readFile(textFile, "utf8");
    splitIntoChunks(text, chunkSize, overlap).forEach((chunk, index) => {
      chunks.push({
        id: `${slugify(path.basename(textFile, ".txt"))}-${index + 1}`,
        sourceFile: textFile,
        chunkIndex: index,
        text: chunk,
        characterCount: chunk.length,
      });
    });
  }

  const index: ChunkIndex = {
    generatedAt: new Date().toISOString(),
    chunkSize,
    overlap,
    chunks,
  };

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  console.log(`Chunks prepared: ${outputFile}`);
  console.log(`Chunks: ${chunks.length}`);
}

function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const maxEnd = Math.min(start + chunkSize, normalized.length);
    const end = findNaturalBreak(normalized, start, maxEnd);
    chunks.push(normalized.slice(start, end).trim());

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

function findNaturalBreak(text: string, start: number, maxEnd: number): number {
  if (maxEnd >= text.length) {
    return text.length;
  }

  const slice = text.slice(start, maxEnd);
  const sentenceBreak = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
  );

  if (sentenceBreak > Math.floor(slice.length * 0.5)) {
    return start + sentenceBreak + 1;
  }

  const wordBreak = slice.lastIndexOf(" ");
  return wordBreak > 0 ? start + wordBreak : maxEnd;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Nombre invalide: ${value}`);
  }

  return parsed;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
