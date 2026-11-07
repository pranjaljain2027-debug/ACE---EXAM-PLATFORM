// Standard Webhooks signature check, as used by Dodo Payments.
// Signed content: `${webhook-id}.${webhook-timestamp}.${rawBody}`, HMAC-SHA256, base64.
// Header `webhook-signature` holds one or more space-separated `v1,<base64>` entries.
// The secret is shown in the Dodo dashboard, usually as `whsec_<base64>`.
const enc = new TextEncoder();

function secretBytes(secret: string): Uint8Array {
  const s = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  try {
    const bin = atob(s);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return enc.encode(s);
  }
}

async function hmacB64(key: Uint8Array, payload: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(payload)));
  let bin = '';
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyStandardWebhook(
  raw: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  toleranceSec = 300,
  now = Date.now(),
): Promise<boolean> {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  const t = Number(timestamp);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > toleranceSec) return false;
  const expected = await hmacB64(secretBytes(secret), `${id}.${timestamp}.${raw}`);
  return signature.split(' ').some((part) => {
    const [ver, sig] = part.split(',');
    return ver === 'v1' && sig !== undefined && safeEqual(sig, expected);
  });
}

/** Test helper: produce a valid header for a payload. */
export async function signStandardWebhook(raw: string, id: string, timestamp: string, secret: string): Promise<string> {
  return `v1,${await hmacB64(secretBytes(secret), `${id}.${timestamp}.${raw}`)}`;
}
