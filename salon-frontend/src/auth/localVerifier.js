const STORAGE_KEY = "pw_verifier";
const LEGACY_PLAINTEXT_KEY = "password";
const ITERATIONS = 150000;
const SALT_BYTES = 16;

function getSubtle() {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  return crypto.subtle;
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  const parts = hex.match(/.{2}/g);
  if (!parts) return new Uint8Array(0);
  return Uint8Array.from(parts.map((h) => parseInt(h, 16)));
}

async function derive(phone, password, saltHex) {
  const subtle = getSubtle();
  const encoder = new TextEncoder();

  const key = await subtle.importKey(
    "raw",
    encoder.encode(`${phone}:${password}`),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256
  );

  return toHex(bits);
}

export function isVerifierSupported() {
  return getSubtle() !== null;
}

export async function storeLocalVerifier(phone, password) {
  if (!isVerifierSupported()) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }

  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const saltHex = toHex(salt);
  const hash = await derive(phone, password, saltHex);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ salt: saltHex, hash }));
  return true;
}

export async function verifyLocalCredentials(phone, password) {
  if (!isVerifierSupported()) return false;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!record || !record.salt || !record.hash) return false;

  const hash = await derive(phone, password, record.salt);
  return hash === record.hash;
}

export function purgeLegacyCredentials() {
  localStorage.removeItem(LEGACY_PLAINTEXT_KEY);
}
