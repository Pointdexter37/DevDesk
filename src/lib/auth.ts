const encoder = new TextEncoder();

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Buffer.from(signature).toString("base64url");
}

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_PASSWORD && process.env.AUTH_SECRET);
}

export async function createSessionToken() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required.");

  const payload = encode(
    JSON.stringify({ expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 }),
  );
  return `${payload}.${await sign(payload, secret)}`;
}

export async function isValidSessionToken(token: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Buffer.from(signature, "base64url"),
      encoder.encode(payload),
    );
    if (!valid) return false;

    const parsed = JSON.parse(decode(payload)) as { expiresAt?: number };
    return typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
}
