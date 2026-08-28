import crypto from 'crypto';
import { executives } from './executives';

export type ExecutivePhoneToken = {
  tenantId: string;
  userId: string;
  slug: string;
  executive: string;
  exp: number;
};

const VOICES: Record<string, { voice: string; language: string }> = {
  Eva: { voice: 'Polly.Olivia-Neural', language: 'en-AU' },
  Heather: { voice: 'Google.en-US-Chirp3-HD-Aoede', language: 'en-US' },
  Nova: { voice: 'Google.en-US-Chirp3-HD-Kore', language: 'en-US' },
  Scout: { voice: 'Google.en-US-Chirp3-HD-Leda', language: 'en-US' },
  Atlas: { voice: 'Google.en-US-Chirp3-HD-Aoede', language: 'en-US' },
  Oracle: { voice: 'Google.en-US-Chirp3-HD-Zephyr', language: 'en-US' },
  Ethos: { voice: 'Google.en-US-Chirp3-HD-Kore', language: 'en-US' },
  Ledger: { voice: 'Google.en-US-Chirp3-HD-Leda', language: 'en-US' },
  'Sierra Bennett': { voice: 'Google.en-US-Chirp3-HD-Aoede', language: 'en-US' },
  'Maya Torres': { voice: 'Google.en-US-Chirp3-HD-Kore', language: 'en-US' },
  'Claire Morgan': { voice: 'Google.en-US-Chirp3-HD-Zephyr', language: 'en-US' },
};

function secret() {
  return (process.env.PHONE_CALL_SIGNING_SECRET || process.env.TWILIO_AUTH_TOKEN || '').trim();
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

export function signPhoneToken(payload: ExecutivePhoneToken) {
  const key = secret();
  if (!key) throw new Error('Phone call signing is not configured.');
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', key).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyPhoneToken(token: string): ExecutivePhoneToken | null {
  try {
    const key = secret();
    if (!key) return null;
    const [body, supplied] = token.split('.');
    if (!body || !supplied) return null;
    const expected = crypto.createHmac('sha256', key).update(body).digest('base64url');
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ExecutivePhoneToken;
    if (!parsed.tenantId || !parsed.userId || !parsed.slug || !parsed.executive || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function voiceFor(name: string) {
  return VOICES[name] || VOICES.Eva;
}

export function executiveByName(name: string) {
  return executives.find((item) => item.name.toLowerCase() === name.toLowerCase()) || executives.find((item) => item.name === 'Eva')!;
}

export function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '\"': '&quot;' }[char] || char));
}

export function publicOrigin(requestOrigin?: string) {
  return (process.env.ARIDON_PUBLIC_URL || requestOrigin || 'https://aridon-v02.vercel.app').replace(/\/$/, '');
}
