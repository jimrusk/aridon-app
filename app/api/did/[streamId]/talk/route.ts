import { NextRequest, NextResponse } from 'next/server';
import { didAuthCandidates, isAuthRejection } from '../../../../../lib/did-auth';

const DID = 'https://api.d-id.com';

// POST /api/did/[streamId]/talk — make the executive speak
//
// D-ID talk endpoint = POST /talks/streams/{streamId}  (NO /talk suffix!)
// The /talk suffix was the cause of the AWS SigV4 errors — it landed on the
// wrong AWS API Gateway resource.
// Auth: try Bearer session_id first (per D-ID streaming docs), then Basic formats.
export async function POST(req: NextRequest, { params }: { params: { streamId: string } }) {
  const k = process.env.DID_API_KEY || '';
  try {
    const body = await req.json();
    const url = `${DID}/talks/streams/${params.streamId}`;  // D-ID talk = POST /talks/streams/{id}, no /talk suffix
    const bodyStr = JSON.stringify(body);

    // Build ordered list of (label, headers) pairs to try
    const attempts: Array<{ label: string; headers: Record<string, string> }> = [];

    // Strategy 1: Bearer session_id (D-ID streaming sessions use this)
    const sessionId = body?.session_id;
    if (sessionId) {
      attempts.push({
        label: `Bearer:${String(sessionId).slice(0, 8)}…`,
        headers: { Authorization: `Bearer ${sessionId}`, 'Content-Type': 'application/json' },
      });
    }

    // Strategy 2: All Basic auth formats (A, B, C, D)
    for (const [i, auth] of didAuthCandidates(k).entries()) {
      attempts.push({
        label: `fmt${i}:${auth.slice(6, 12)}…`,
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
      });
    }

    // Strategy 3: No Authorization header
    attempts.push({
      label: 'no-auth',
      headers: { 'Content-Type': 'application/json' },
    });

    let lastStatus = 500;
    let lastData: any = { error: 'all auth strategies failed' };

    for (const { label, headers } of attempts) {
      const res = await fetch(url, { method: 'POST', headers, body: bodyStr });
      const data = await res.json().catch(() => ({}));
      lastStatus = res.status;
      lastData = { ...data, _authFmt: label };
      if (!isAuthRejection(res.status, data)) break;
    }

    return NextResponse.json(lastData, { status: lastStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
