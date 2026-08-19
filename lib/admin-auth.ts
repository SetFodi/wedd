export const ADMIN_COOKIE = "wedd_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

async function runtimeValue(name: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET"): Promise<string | undefined> {
  try {
    const { env } = await import("cloudflare:workers");
    const workerEnv = env as unknown as Record<string, unknown>;
    const value = workerEnv[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // A plain Node test runner has no Cloudflare runtime module.
  }

  const nodeValue = typeof process !== "undefined" ? process.env[name] : undefined;
  return nodeValue?.trim() || undefined;
}

async function password(): Promise<string | null> {
  return (await runtimeValue("ADMIN_PASSWORD")) ?? null;
}

async function sessionSecret(): Promise<string | null> {
  const configured = await runtimeValue("ADMIN_SESSION_SECRET");
  if (configured) return configured;
  const configuredPassword = await password();
  return configuredPassword ? `wedding-admin:${configuredPassword}` : null;
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function signature(payload: string): Promise<string | null> {
  const secret = await sessionSecret();
  if (!secret) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const configuredPassword = await password();
  if (!configuredPassword) return false;
  const [candidateDigest, passwordDigest] = await Promise.all([
    digest(candidate),
    digest(configuredPassword),
  ]);
  return equalBytes(candidateDigest, passwordDigest);
}

export async function createAdminSessionCookie(requestUrl: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${expires}`;
  const signedPayload = await signature(payload);
  if (!signedPayload) throw new Error("Admin authentication is not configured.");
  const value = `${payload}.${signedPayload}`;
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearAdminSessionCookie(requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function cookieValue(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const entry of cookieHeader.split(";")) {
    const [name, ...parts] = entry.trim().split("=");
    if (name === ADMIN_COOKIE) return parts.join("=") || null;
  }
  return null;
}

export async function hasAdminSession(cookieHeader: string | null): Promise<boolean> {
  const value = cookieValue(cookieHeader);
  if (!value) return false;
  const separator = value.indexOf(".");
  if (separator < 1) return false;

  const payload = value.slice(0, separator);
  const suppliedSignature = value.slice(separator + 1);
  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000)) return false;

  const expectedSignature = await signature(payload);
  if (!expectedSignature) return false;
  const [left, right] = await Promise.all([
    digest(suppliedSignature),
    digest(expectedSignature),
  ]);
  return equalBytes(left, right);
}
