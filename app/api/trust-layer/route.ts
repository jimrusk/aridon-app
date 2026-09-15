import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { assessTrust, TrustInput } from '@/lib/trustLayer';

export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
};

function normalizePayload(input: TrustInput) {
  return JSON.stringify({
    channel: input.channel,
    message: input.message || '',
    claimedOrganization: input.claimedOrganization || '',
    claimedDomain: input.claimedDomain || '',
    sender: input.sender || '',
    url: input.url || '',
    amount: Number(input.amount || 0),
    verificationEvidence: (input.verificationEvidence || []).slice(0, 10),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrustInput;
    if (!body?.channel) {
      return NextResponse.json({ error: 'A channel is required.' }, { status: 400, headers: NO_STORE });
    }

    const assessment = assessTrust(body);
    const digest = createHash('sha256').update(normalizePayload(body)).digest('hex');
    const receipt = {
      id: `trust_${digest.slice(0, 16)}`,
      inputFingerprint: digest,
      generatedAt: new Date().toISOString(),
      policyVersion: '2026.09-a',
      rawContentStored: false,
    };

    return NextResponse.json({ assessment, receipt }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Trust Layer assessment failed.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
