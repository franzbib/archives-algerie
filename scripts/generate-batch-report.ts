/**
 * generate-batch-report.ts
 *
 * Diagnostic local d'un lot d'archives.
 * Lecture seule — aucun appel OpenAI / Drive / R2.
 * Sortie : .local/archive-batches/<lotId>/batch-report.json
 *
 * Usage :
 *   npx.cmd tsx scripts/generate-batch-report.ts --lot lot-gouas-zaouias-001
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const lotFlagIndex = args.indexOf("--lot");

if (lotFlagIndex === -1 || !args[lotFlagIndex + 1]) {
  console.error("Usage: npx tsx scripts/generate-batch-report.ts --lot <lotId>");
  process.exit(1);
}

const lotId = args[lotFlagIndex + 1];

// ---------------------------------------------------------------------------
// Chemins
// ---------------------------------------------------------------------------

const LOCAL_BASE = path.join(".local", "archive-batches", lotId);
const GENERATED_BASE = path.join("data", "generated", "batches", lotId);

const DIRS = {
  jpg: path.join(LOCAL_BASE, "jpg"),
  ocrRaw: path.join(LOCAL_BASE, "ocr-raw"),
  ocrClean: path.join(LOCAL_BASE, "ocr-clean"),
  assistedVision: path.join(LOCAL_BASE, "assisted-reading-vision"),
  publicLocal: path.join(LOCAL_BASE, "public"),
};

const FILES = {
  publicAssetsLocal: path.join(LOCAL_BASE, "public", "public-assets.json"),
  publicAssetsGenerated: path.join(GENERATED_BASE, "public-assets.json"),
  assistedReadingsGenerated: path.join(GENERATED_BASE, "assisted-readings.json"),
};

const REPORT_OUT = path.join(LOCAL_BASE, "batch-report.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dirExists(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function fileExists(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

function listFiles(dir: string): string[] {
  if (!dirExists(dir)) return [];
  return fs.readdirSync(dir).filter((f) => {
    return fs.statSync(path.join(dir, f)).isFile();
  });
}

function extractPageKey(filename: string): string {
  const match = filename.match(/^(page-\d+)/i);
  if (match) return match[1];
  return filename.replace(/\.[^.]+$/, "");
}

function parseJsonFile(filePath: string): { valid: boolean; data: unknown } {
  try {
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    const data = JSON.parse(raw);
    return { valid: true, data };
  } catch {
    return { valid: false, data: null };
  }
}

function extractAssistedText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const d = data as Record<string, unknown>;
  if (typeof d.assistedReadingText === "string") return d.assistedReadingText;
  if (Array.isArray(d.content)) {
    const texts = (d.content as unknown[])
      .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
      .map((c) => (typeof c.text === "string" ? c.text : ""))
      .join(" ");
    return texts;
  }
  return "";
}

function extractStatus(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const d = data as Record<string, unknown>;
  return typeof d.status === "string" ? d.status : "";
}

// ---------------------------------------------------------------------------
// Collecte des clés de pages connues
// ---------------------------------------------------------------------------

function collectPageKeys(): Set<string> {
  const keys = new Set<string>();
  for (const dir of Object.values(DIRS)) {
    if (!dirExists(dir)) continue;
    for (const f of listFiles(dir)) {
      keys.add(extractPageKey(f));
    }
  }
  return keys;
}

function buildFileIndex(dir: string): Map<string, string> {
  const index = new Map<string, string>();
  if (!dirExists(dir)) return index;
  for (const f of listFiles(dir)) {
    index.set(extractPageKey(f), path.join(dir, f));
  }
  return index;
}

// ---------------------------------------------------------------------------
// Chargement du manifeste public-assets.json local
// ---------------------------------------------------------------------------

type PublicAsset = {
  reviewId?: string;
  pageId?: string;
  publicUrl?: string;
};

function loadPublicAssetsLocal(): Map<string, PublicAsset> {
  const index = new Map<string, PublicAsset>();
  if (!fileExists(FILES.publicAssetsLocal)) return index;
  const { valid, data } = parseJsonFile(FILES.publicAssetsLocal);
  if (!valid || !Array.isArray(data)) return index;
  for (const item of data as PublicAsset[]) {
    const key = item.reviewId ?? item.pageId ?? "";
    if (key) index.set(key, item);
  }
  return index;
}

// ---------------------------------------------------------------------------
// Types du rapport
// ---------------------------------------------------------------------------

type PageIssue =
  | "missing_jpg"
  | "missing_ocr_raw"
  | "missing_ocr_clean"
  | "missing_assisted_vision"
  | "invalid_assisted_json"
  | "empty_assisted_text"
  | "not_in_public_assets";

type PageReport = {
  pageKey: string;
  jpgPresent: boolean;
  ocrRawPresent: boolean;
  ocrCleanPresent: boolean;
  assistedVisionPresent: boolean;
  assistedVisionJsonValid: boolean | null;
  assistedTextEmpty: boolean | null;
  assistedStatus: string | null;
  inPublicAssetsLocal: boolean;
  issues: PageIssue[];
};

type Summary = {
  lotId: string;
  generatedAt: string;
  totalPageKeys: number;
  jpgCount: number;
  ocrRawCount: number;
  ocrCleanCount: number;
  assistedVisionCount: number;
  assistedVisionValidJson: number;
  assistedVisionInvalidJson: number;
  assistedTextNonEmpty: number;
  assistedTextEmpty: number;
  pagesWithoutAssisted: number;
  publicAssetsLocalPresent: boolean;
  publicAssetsGeneratedPresent: boolean;
  assistedReadingsGeneratedPresent: boolean;
  pagesInPublicAssetsLocal: number;
  issueCount: number;
};

type BatchReport = {
  summary: Summary;
  pages: PageReport[];
};

// ---------------------------------------------------------------------------
// Construction du rapport
// ---------------------------------------------------------------------------

function generateReport(): BatchReport {
  console.log(`\n📂 Lot : ${lotId}`);
  console.log(`   Dossier local : ${LOCAL_BASE}\n`);

  if (!dirExists(LOCAL_BASE)) {
    console.error(`❌ Dossier local introuvable : ${LOCAL_BASE}`);
    process.exit(1);
  }

  const jpgIndex = buildFileIndex(DIRS.jpg);
  const ocrRawIndex = buildFileIndex(DIRS.ocrRaw);
  const ocrCleanIndex = buildFileIndex(DIRS.ocrClean);
  const assistedIndex = buildFileIndex(DIRS.assistedVision);
  const publicAssetsLocal = loadPublicAssetsLocal();

  const publicAssetsLocalPresent = fileExists(FILES.publicAssetsLocal);
  const publicAssetsGeneratedPresent = fileExists(FILES.publicAssetsGenerated);
  const assistedReadingsGeneratedPresent = fileExists(FILES.assistedReadingsGenerated);

  const pageKeys = collectPageKeys();
  console.log(`   Pages détectées : ${pageKeys.size}`);

  const pages: PageReport[] = [];

  for (const pageKey of [...pageKeys].sort()) {
    const jpgPresent = jpgIndex.has(pageKey);
    const ocrRawPresent = ocrRawIndex.has(pageKey);
    const ocrCleanPresent = ocrCleanIndex.has(pageKey);
    const assistedVisionPresent = assistedIndex.has(pageKey);

    let assistedVisionJsonValid: boolean | null = null;
    let assistedTextEmpty: boolean | null = null;
    let assistedStatus: string | null = null;

    if (assistedVisionPresent) {
      const filePath = assistedIndex.get(pageKey)!;
      const { valid, data } = parseJsonFile(filePath);
      assistedVisionJsonValid = valid;
      if (valid) {
        const text = extractAssistedText(data);
        assistedTextEmpty = text.trim().length === 0;
        assistedStatus = extractStatus(data) || null;
      }
    }

    const inPublicAssetsLocal = publicAssetsLocal.has(pageKey);

    const issues: PageIssue[] = [];
    if (!jpgPresent) issues.push("missing_jpg");
    if (!ocrRawPresent) issues.push("missing_ocr_raw");
    if (!ocrCleanPresent) issues.push("missing_ocr_clean");
    if (!assistedVisionPresent) issues.push("missing_assisted_vision");
    if (assistedVisionJsonValid === false) issues.push("invalid_assisted_json");
    if (assistedTextEmpty === true) issues.push("empty_assisted_text");
    if (!inPublicAssetsLocal && publicAssetsLocalPresent) issues.push("not_in_public_assets");

    pages.push({
      pageKey,
      jpgPresent,
      ocrRawPresent,
      ocrCleanPresent,
      assistedVisionPresent,
      assistedVisionJsonValid,
      assistedTextEmpty,
      assistedStatus,
      inPublicAssetsLocal,
      issues,
    });
  }

  const summary: Summary = {
    lotId,
    generatedAt: new Date().toISOString(),
    totalPageKeys: pages.length,
    jpgCount: pages.filter((p) => p.jpgPresent).length,
    ocrRawCount: pages.filter((p) => p.ocrRawPresent).length,
    ocrCleanCount: pages.filter((p) => p.ocrCleanPresent).length,
    assistedVisionCount: pages.filter((p) => p.assistedVisionPresent).length,
    assistedVisionValidJson: pages.filter((p) => p.assistedVisionJsonValid === true).length,
    assistedVisionInvalidJson: pages.filter((p) => p.assistedVisionJsonValid === false).length,
    assistedTextNonEmpty: pages.filter((p) => p.assistedTextEmpty === false).length,
    assistedTextEmpty: pages.filter((p) => p.assistedTextEmpty === true).length,
    pagesWithoutAssisted: pages.filter((p) => !p.assistedVisionPresent).length,
    publicAssetsLocalPresent,
    publicAssetsGeneratedPresent,
    assistedReadingsGeneratedPresent,
    pagesInPublicAssetsLocal: pages.filter((p) => p.inPublicAssetsLocal).length,
    issueCount: pages.reduce((acc, p) => acc + p.issues.length, 0),
  };

  return { summary, pages };
}

// ---------------------------------------------------------------------------
// Affichage console
// ---------------------------------------------------------------------------

function printSummary(report: BatchReport): void {
  const s = report.summary;
  console.log("\n────────────────────────────────────────");
  console.log("  SYNTHÈSE");
  console.log("────────────────────────────────────────");
  console.log(`  Pages détectées          : ${s.totalPageKeys}`);
  console.log(`  JPG convertis            : ${s.jpgCount}`);
  console.log(`  OCR brut                 : ${s.ocrRawCount}`);
  console.log(`  OCR clean                : ${s.ocrCleanCount}`);
  console.log(`  Lectures assistées       : ${s.assistedVisionCount}`);
  console.log(`    JSON valides           : ${s.assistedVisionValidJson}`);
  console.log(`    JSON invalides         : ${s.assistedVisionInvalidJson}`);
  console.log(`    Texte non vide         : ${s.assistedTextNonEmpty}`);
  console.log(`    Texte vide             : ${s.assistedTextEmpty}`);
  console.log(`  Pages sans lecture       : ${s.pagesWithoutAssisted}`);
  console.log(`  Dans public-assets local : ${s.pagesInPublicAssetsLocal}`);
  console.log("");
  console.log(`  public-assets.json local    : ${s.publicAssetsLocalPresent ? "✓ présent" : "✗ absent"}`);
  console.log(`  public-assets.json généré   : ${s.publicAssetsGeneratedPresent ? "✓ présent" : "✗ absent"}`);
  console.log(`  assisted-readings.json généré: ${s.assistedReadingsGeneratedPresent ? "✓ présent" : "✗ absent"}`);
  console.log("");
  console.log(`  Problèmes détectés total : ${s.issueCount}`);

  const pagesWithIssues = report.pages.filter((p) => p.issues.length > 0);
  if (pagesWithIssues.length > 0) {
    console.log("\n  Pages avec problèmes :");
    for (const p of pagesWithIssues) {
      console.log(`    ${p.pageKey} → ${p.issues.join(", ")}`);
    }
  } else {
    console.log("\n  ✓ Aucun problème détecté.");
  }

  console.log("────────────────────────────────────────\n");
}

// ---------------------------------------------------------------------------
// Écriture du rapport
// ---------------------------------------------------------------------------

function writeReport(report: BatchReport): void {
  fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
  fs.writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2), "utf-8");
  console.log(`✓ Rapport écrit : ${REPORT_OUT}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const report = generateReport();
printSummary(report);
writeReport(report);