import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const TOKEN_EXPIRY_SKEW_SECONDS = 60;

interface ServiceAccountKey {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
}

export type DriveAuth =
  | {
      mode: "api_key";
      apiKey: string;
    }
  | {
      mode: "service_account";
      accessToken: string;
      clientEmail: string;
      keyPath: string;
    };

let cachedServiceAccountToken:
  | {
      accessToken: string;
      clientEmail: string;
      expiresAtSeconds: number;
      keyPath: string;
    }
  | null = null;

export function getServiceAccountKeyPath(): string | undefined {
  return (
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export async function getOptionalDriveAuth(): Promise<DriveAuth | null> {
  const serviceAccountKeyPath = getServiceAccountKeyPath();
  if (serviceAccountKeyPath) {
    return getServiceAccountDriveAuth(serviceAccountKeyPath);
  }

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  return apiKey ? { apiKey, mode: "api_key" } : null;
}

export async function getRequiredDriveAuth(actionLabel: string): Promise<DriveAuth> {
  const auth = await getOptionalDriveAuth();
  if (!auth) {
    throw new Error(
      `${actionLabel} requiert GOOGLE_SERVICE_ACCOUNT_KEY_PATH, GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_DRIVE_API_KEY.`,
    );
  }

  return auth;
}

export function applyDriveAuth(url: URL, init: RequestInit, auth: DriveAuth): RequestInit {
  if (auth.mode === "api_key") {
    url.searchParams.set("key", auth.apiKey);
    return init;
  }

  return {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${auth.accessToken}`,
    },
  };
}

export function describeDriveAuth(auth: DriveAuth | null): string {
  if (!auth) return "mock";
  if (auth.mode === "api_key") return "api_key";

  return `service_account:${auth.clientEmail}`;
}

async function getServiceAccountDriveAuth(keyPath: string): Promise<DriveAuth> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    cachedServiceAccountToken &&
    cachedServiceAccountToken.keyPath === keyPath &&
    cachedServiceAccountToken.expiresAtSeconds - TOKEN_EXPIRY_SKEW_SECONDS > nowSeconds
  ) {
    return {
      accessToken: cachedServiceAccountToken.accessToken,
      clientEmail: cachedServiceAccountToken.clientEmail,
      keyPath,
      mode: "service_account",
    };
  }

  const serviceAccount = await readServiceAccountKey(keyPath);
  const issuedAt = nowSeconds;
  const expiresAt = issuedAt + 3600;
  const assertion = signJwt(
    {
      alg: "RS256",
      typ: "JWT",
    },
    {
      aud: serviceAccount.token_uri ?? DEFAULT_TOKEN_URI,
      exp: expiresAt,
      iat: issuedAt,
      iss: serviceAccount.client_email,
      scope: DRIVE_READONLY_SCOPE,
    },
    serviceAccount.private_key,
  );
  const tokenUri = serviceAccount.token_uri ?? DEFAULT_TOKEN_URI;
  const response = await fetch(tokenUri, {
    body: new URLSearchParams({
      assertion,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Authentification Drive compte de service echouee (${response.status}): ${compactBodyPreview(body)}`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error("Authentification Drive compte de service echouee: access_token absent.");
  }

  cachedServiceAccountToken = {
    accessToken: payload.access_token,
    clientEmail: serviceAccount.client_email,
    expiresAtSeconds: issuedAt + (payload.expires_in ?? 3600),
    keyPath,
  };

  return {
    accessToken: cachedServiceAccountToken.accessToken,
    clientEmail: cachedServiceAccountToken.clientEmail,
    keyPath,
    mode: "service_account",
  };
}

async function readServiceAccountKey(keyPath: string): Promise<{
  client_email: string;
  private_key: string;
  token_uri?: string;
}> {
  const raw = await readFile(keyPath, "utf8");
  const key = JSON.parse(raw) as ServiceAccountKey;

  if (!key.client_email || !key.private_key) {
    throw new Error(
      `Fichier compte de service invalide: ${keyPath}. Champs requis: client_email, private_key.`,
    );
  }

  return {
    client_email: key.client_email,
    private_key: key.private_key,
    token_uri: key.token_uri,
  };
}

function signJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  privateKey: string,
): string {
  const unsignedToken = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  return `${unsignedToken}.${base64Url(signer.sign(privateKey))}`;
}

function base64UrlJson(value: Record<string, unknown>): string {
  return base64Url(Buffer.from(JSON.stringify(value), "utf8"));
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function compactBodyPreview(body: string): string {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length > 500 ? `${compact.slice(0, 500)}...` : compact;
}
