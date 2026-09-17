import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runBrowserExploration } from '../../../../lib/browserWorker';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const ONE_TIME_KEY_HASH = 'ad25394e11365e790f315e36c81b8cbd5746c2c70cf1042874f76d4d441a1e7c';

function safeEqualHex(a: string, b: string) {
  try {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const supplied = request.nextUrl.searchParams.get('key') || '';
  const suppliedHash = createHash('sha256').update(supplied).digest('hex');
  if (!supplied || !safeEqualHex(suppliedHash, ONE_TIME_KEY_HASH)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const url = (request.nextUrl.searchParams.get('url') || '').trim().slice(0, 2000);
  const objective = (request.nextUrl.searchParams.get('objective') || '').trim().slice(0, 2500);
  if (!url || !objective) {
    return NextResponse.json({ error: 'url and objective are required.' }, { status: 400, headers: NO_STORE });
  }

  const exploration = await runBrowserExploration({
    objective: `${objective}\n\nStart at: ${url}`,
    candidateUrls: [url],
    maxSteps: 5,
  });

  return NextResponse.json({
    ok: !exploration.error,
    engine: exploration.engine || 'aridon',
    exploration,
  }, { status: exploration.error && !exploration.ran ? 502 : 200, headers: NO_STORE });
}
