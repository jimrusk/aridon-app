import { NextRequest, NextResponse } from 'next/server';
import { didAuthCandidates, isAuthRejection } from '../../../../lib/did-auth';

const DID = 'https://api.d-id.com';

// DELETE /api/did/[streamId] — close the D-ID stream
export async function DELETE(_req: NextRequest, { params }: { params: { streamId: string } }) {
  const k = process.env.DID_API_KEY || '';
  for (const auth of didAuthCandidates(k)) {
    try {
      const res = await fetch(`${DID}/talks/streams/${params.streamId}`, {
        method: 'DELETE',
        headers: { Authorization: auth },
      });
      if (res.ok || res.status === 404) {
        return NextResponse.json({ ok: true, status: res.status });
      }
      const body = await res.json().catch(() => ({}));
      if (!isAuthRejection(res.status, body)) {
        return NextResponse.json({ ok: false, status: res.status, body }, { status: res.status });
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, error: 'all auth formats rejected for DELETE' }, { status: 401 });
}
