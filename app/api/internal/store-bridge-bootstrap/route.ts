import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOOTSTRAP_KEY_HASH = '36504111e33587da7d8174d64393d65f1b8faa9a991ee984cbace407fe5897bb';

function safeEqualHex(a: string, b: string) {
  try {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function bridgeSource() {
  const candidates: Array<[string, string | undefined]> = [
    ['ARIDON_STORE_BRIDGE_SECRET', process.env.ARIDON_STORE_BRIDGE_SECRET],
    ['CRON_SECRET', process.env.CRON_SECRET],
    ['OPENAI_API_KEY', process.env.OPENAI_API_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
  ];
  for (const [name, value] of candidates) {
    const secret = value?.trim();
    if (secret) return { name, secret };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const supplied = request.nextUrl.searchParams.get('key') || '';
  const suppliedHash = createHash('sha256').update(supplied).digest('hex');
  if (!supplied || !safeEqualHex(suppliedHash, BOOTSTRAP_KEY_HASH)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const source = bridgeSource();
  if (!source) return NextResponse.json({ configured: false });
  const bridgeToken = createHash('sha256').update(`aridon-store-bridge-v1:${source.secret}`).digest('hex');
  const verifier = createHash('sha256').update(bridgeToken).digest('hex');
  return NextResponse.json({ configured: true, source: source.name, verifier });
}
