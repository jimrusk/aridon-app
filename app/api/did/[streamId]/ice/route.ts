import { NextRequest, NextResponse } from 'next/server';
import { didAuthCandidates, isAuthRejection } from '../../../../../lib/did-auth';

const DID = 'https://api.d-id.com';

// POST /api/did/[streamId]/ice — relay ICE candidates to D-ID
export async function POST(req: NextRequest, { params }: { params: { streamId: string } }) {
  const k = process.env.DID_API_KEY || '';
  try {
    const body = await req.json();
    const bodyStr = JSON.stringify(body);
    for (const auth of didAuthCandidates(k)) {
      const res = await fetch(`${DID}/talks/streams/${params.streamId}/ice`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: bodyStr,
      });
      const data = await res.json().catch(() => ({}));
      if (!isAuthRejection(res.status, data)) {
        return NextResponse.json(data, { status: res.status });
      }
    }
    return NextResponse.json({ error: 'all auth formats rejected for ICE' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
