import { createHmac, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

interface ConversionManifest {
  files: ConversionManifestFile[];
}

interface ConversionManifestFile {
  collectionId: string;
  driveFileId: string;
  driveUrl: string;
  convertedJpgPath: string;
  originalFileName: string;
  sampleOrder: number | null;
}

interface PilotAsset {
  collectionId: string;
  originalDriveFileId?: string;
  originalDriveUrl?: string;
  localJpgFile: string;
  r2ObjectKey: string;
  publicUrl?: string;
  futurePublicUrl?: string;
  publicationStatus: "image_published_unvalidated";
  validationStatus: "unverified";
  note: "Image pilote publiee pour consultation ; page/document non valide.";
}

interface PublicPilotAssetsManifest {
  generatedAt: string;
  storageProvider: "cloudflare_r2";
  bucketName: string;
  prefix: string;
  assetCount: number;
  warning: string;
  assets: PilotAsset[];
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl?: string;
}

interface UploadCandidate {
  collectionId: string;
  originalDriveFileId?: string;
  originalDriveUrl?: string;
  localJpgFile: string;
  sampleOrder: number | null;
}

const DEFAULT_INPUT_DIRECTORY = ".local/archive-sample/converted";
const DEFAULT_MANIFEST_PATH = ".local/archive-sample/conversion-manifest.json";
const DEFAULT_OUTPUT_MANIFEST =
  ".local/archive-sample/public/public-pilot-assets.json";
const DEFAULT_PREFIX = "pilot/shd-1h4382-d1-boghari/images";
const DEFAULT_COLLECTION_ID = "shd-1h4382-d1-boghari";
const DEFAULT_LIMIT = 8;
const R2_REGION = "auto";
const S3_SERVICE = "s3";

async function main() {
  const confirmed = process.argv.includes("--confirm");
  if (!confirmed) {
    throw new Error(
      "Upload refuse: ajoutez --confirm pour confirmer l'envoi vers Cloudflare R2.",
    );
  }

  const config = getR2Config();
  const inputDirectory = getArg("--input") ?? DEFAULT_INPUT_DIRECTORY;
  const manifestPath = getArg("--manifest") ?? DEFAULT_MANIFEST_PATH;
  const outputManifestPath = getArg("--out") ?? DEFAULT_OUTPUT_MANIFEST;
  const prefix = trimSlashes(getArg("--prefix") ?? DEFAULT_PREFIX);
  const collectionId = getArg("--collection-id") ?? DEFAULT_COLLECTION_ID;
  const limit = getLimit();

  await requireDirectory(inputDirectory, "dossier JPG convertis");

  const candidates = existsSync(manifestPath)
    ? await getCandidatesFromConversionManifest(manifestPath, inputDirectory)
    : await getCandidatesFromJpgDirectory(inputDirectory, collectionId);

  const selectedCandidates = candidates
    .sort(compareCandidates)
    .slice(0, limit);

  if (selectedCandidates.length === 0) {
    throw new Error(`Aucun JPG pilote trouve dans ${inputDirectory}.`);
  }

  const assets: PilotAsset[] = [];

  for (const candidate of selectedCandidates) {
    const r2ObjectKey = `${prefix}/${path.basename(candidate.localJpgFile)}`;
    const fileBuffer = await readFile(candidate.localJpgFile);

    await putObjectToR2({
      body: fileBuffer,
      config,
      contentType: "image/jpeg",
      objectKey: r2ObjectKey,
    });

    assets.push({
      collectionId: candidate.collectionId,
      originalDriveFileId: candidate.originalDriveFileId,
      originalDriveUrl: candidate.originalDriveUrl,
      localJpgFile: toPortablePath(candidate.localJpgFile),
      r2ObjectKey,
      ...getPublicUrlFields(config.publicBaseUrl, r2ObjectKey),
      publicationStatus: "image_published_unvalidated",
      validationStatus: "unverified",
      note: "Image pilote publiee pour consultation ; page/document non valide.",
    });

    console.log(`Uploaded ${candidate.localJpgFile} -> ${r2ObjectKey}`);
  }

  const publicManifest: PublicPilotAssetsManifest = {
    generatedAt: new Date().toISOString(),
    storageProvider: "cloudflare_r2",
    bucketName: config.bucketName,
    prefix,
    assetCount: assets.length,
    warning:
      "Images pilotes publiees pour consultation: page/document non valides, OCR et lecture assistee non valides.",
    assets,
  };

  await mkdir(path.dirname(outputManifestPath), { recursive: true });
  await writeFile(
    outputManifestPath,
    `${JSON.stringify(publicManifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`Public pilot assets manifest written: ${outputManifestPath}`);
}

async function getCandidatesFromConversionManifest(
  manifestPath: string,
  inputDirectory: string,
): Promise<UploadCandidate[]> {
  const conversionManifest = await readJson<ConversionManifest>(manifestPath);

  return conversionManifest.files
    .filter((file) => isJpgFileName(file.convertedJpgPath))
    .map((file) => ({
      collectionId: file.collectionId,
      originalDriveFileId: file.driveFileId,
      originalDriveUrl: file.driveUrl,
      localJpgFile: path.join(inputDirectory, path.basename(file.convertedJpgPath)),
      sampleOrder: file.sampleOrder,
    }))
    .filter((candidate) => existsSync(candidate.localJpgFile));
}

async function getCandidatesFromJpgDirectory(
  inputDirectory: string,
  collectionId: string,
): Promise<UploadCandidate[]> {
  const entries = await readdir(inputDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && isJpgFileName(entry.name))
    .map((entry, index) => ({
      collectionId,
      localJpgFile: path.join(inputDirectory, entry.name),
      sampleOrder: index + 1,
    }));
}

async function putObjectToR2(options: {
  body: Buffer;
  config: R2Config;
  contentType: "image/jpeg";
  objectKey: string;
}) {
  const host = `${options.config.accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${encodePathSegment(
    options.config.bucketName,
  )}/${encodeObjectKey(options.objectKey)}`;
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(options.body);
  const headers = {
    "content-type": options.contentType,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const authorization = signRequest({
    accessKeyId: options.config.accessKeyId,
    dateStamp,
    headers,
    method: "PUT",
    objectKey: options.objectKey,
    payloadHash,
    secretAccessKey: options.config.secretAccessKey,
    urlPath: `/${encodePathSegment(options.config.bucketName)}/${encodeObjectKey(
      options.objectKey,
    )}`,
  });

  let response: Response;

  try {
    response = await fetch(url, {
      body: new Uint8Array(options.body),
      headers: {
        ...headers,
        authorization,
      },
      method: "PUT",
    });
  } catch (error) {
    throw new Error(
      `Erreur reseau upload R2 pour ${options.objectKey}: ${formatFetchFailure(error)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Erreur upload R2 ${response.status} pour ${options.objectKey}: ${await response.text()}`,
    );
  }
}

function formatFetchFailure(error: unknown): string {
  if (!(error instanceof Error)) {
    return "erreur inconnue avant reponse HTTP.";
  }

  const cause = error.cause as { code?: unknown; name?: unknown } | undefined;
  const code = typeof cause?.code === "string" ? cause.code : null;
  const name = typeof cause?.name === "string" ? cause.name : error.name;

  return code
    ? `${error.message} (${name}, ${code})`
    : `${error.message} (${name})`;
}

function signRequest(options: {
  accessKeyId: string;
  dateStamp: string;
  headers: Record<string, string>;
  method: "PUT";
  objectKey: string;
  payloadHash: string;
  secretAccessKey: string;
  urlPath: string;
}): string {
  const signedHeaders = Object.keys(options.headers).sort().join(";");
  const canonicalHeaders = Object.entries(options.headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value.trim()}\n`)
    .join("");
  const canonicalRequest = [
    options.method,
    options.urlPath,
    "",
    canonicalHeaders,
    signedHeaders,
    options.payloadHash,
  ].join("\n");
  const credentialScope = `${options.dateStamp}/${R2_REGION}/${S3_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    options.headers["x-amz-date"],
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = getSignatureKey(
    options.secretAccessKey,
    options.dateStamp,
    R2_REGION,
    S3_SERVICE,
  );
  const signature = hmacHex(signingKey, stringToSign);

  return [
    `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");
}

function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string,
): Buffer {
  const kDate = hmacBuffer(`AWS4${key}`, dateStamp);
  const kRegion = hmacBuffer(kDate, regionName);
  const kService = hmacBuffer(kRegion, serviceName);
  return hmacBuffer(kService, "aws4_request");
}

function hmacBuffer(key: string | Buffer, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hmacHex(key: Buffer, value: string): string {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function getR2Config(): R2Config {
  const accountId = normalizeR2AccountId(requireEnv("R2_ACCOUNT_ID"));
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = requireEnv("R2_BUCKET_NAME");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  };
}

function normalizeR2AccountId(value: string): string {
  const hostLikeValue = value
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.r2\.cloudflarestorage\.com$/i, "");

  if (!hostLikeValue || hostLikeValue.includes(".")) {
    throw new Error(
      "R2_ACCOUNT_ID doit contenir l'identifiant de compte Cloudflare ou l'endpoint R2 du compte.",
    );
  }

  return hostLikeValue;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    throw new Error(`${name} est requise pour l'upload R2.`);
  }

  return trimmedValue;
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

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function compareCandidates(a: UploadCandidate, b: UploadCandidate): number {
  const aOrder = a.sampleOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.sampleOrder ?? Number.MAX_SAFE_INTEGER;
  return aOrder - bOrder || a.localJpgFile.localeCompare(b.localJpgFile);
}

function getPublicUrlFields(
  publicBaseUrl: string | undefined,
  objectKey: string,
): Pick<PilotAsset, "futurePublicUrl" | "publicUrl"> {
  if (!publicBaseUrl) {
    return {
      futurePublicUrl: `R2_PUBLIC_BASE_URL/${objectKey}`,
    };
  }

  return {
    publicUrl: `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`,
  };
}

function getLimit(): number {
  const rawLimit = getArg("--limit");
  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--limit doit etre un entier positif.");
  }

  return parsed;
}

function isJpgFileName(fileName: string): boolean {
  const extension = path.extname(fileName).toLocaleLowerCase("fr");
  return extension === ".jpg" || extension === ".jpeg";
}

function encodeObjectKey(objectKey: string): string {
  return objectKey.split("/").map(encodePathSegment).join("/");
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
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
