import crypto from 'crypto';

export type EvaMeetingBridgeClaims = {
  sub: string;
  title: string;
  goal: string;
  exp: number;
  iat: number;
  jti: string;
};

const MAX_TITLE = 180;
const MAX_GOAL = 1_200;
const DEFAULT_TTL_SECONDS = 6 * 60 * 60;

function signingKey() {
  const source = (
    process.env.EVA_MEETING_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  ).trim();
  if (!source) throw new Error('Eva meeting bridge signing is not configured.');
  return crypto.createHash('sha256').update(`aridon:eva-meeting:${source}`).digest();
}

function encode(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

export function createEvaMeetingBridgeToken(input: {
  userId: string;
  title?: unknown;
  goal?: unknown;
  ttlSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10 * 60, Math.min(input.ttlSeconds || DEFAULT_TTL_SECONDS, 12 * 60 * 60));
  const claims: EvaMeetingBridgeClaims = {
    sub: input.userId,
    title: cleanText(input.title, MAX_TITLE) || 'Aridon Partner Meeting',
    goal:
      cleanText(input.goal, MAX_GOAL) ||
      'Represent Aridon accurately, answer questions when addressed, identify partner fit, and help the room leave with a clear next step.',
    iat: now,
    exp: now + ttl,
    jti: crypto.randomUUID(),
  };

  const payload = encode(JSON.stringify(claims));
  const signature = encode(crypto.createHmac('sha256', signingKey()).update(payload).digest());
  return `${payload}.${signature}`;
}

export function verifyEvaMeetingBridgeToken(token: string): EvaMeetingBridgeClaims | null {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra || payload.length > 8_000 || signature.length > 100) return null;

  const expected = encode(crypto.createHmac('sha256', signingKey()).update(payload).digest());
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<EvaMeetingBridgeClaims>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.sub !== 'string' || !claims.sub ||
      typeof claims.title !== 'string' || claims.title.length > MAX_TITLE ||
      typeof claims.goal !== 'string' || claims.goal.length > MAX_GOAL ||
      typeof claims.exp !== 'number' || claims.exp < now || claims.exp > now + 12 * 60 * 60 ||
      typeof claims.iat !== 'number' || claims.iat > now + 60 ||
      typeof claims.jti !== 'string' || !claims.jti
    ) return null;

    return claims as EvaMeetingBridgeClaims;
  } catch {
    return null;
  }
}
