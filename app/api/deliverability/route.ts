import { NextRequest, NextResponse } from 'next/server';
import { resolveTxt } from 'node:dns/promises';
import { scoreDeliverability, type AuthState, type DeliverabilityInput } from '../../../lib/deliverability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function domainFrom(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  const at = normalized.lastIndexOf('@');
  const domain = at >= 0 ? normalized.slice(at + 1) : normalized;
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? domain : '';
}

async function txtRecords(name: string) {
  try {
    const rows = await resolveTxt(name);
    return rows.map((parts) => parts.join(''));
  } catch {
    return [];
  }
}

function stateFromRecord(records: string[], prefix: RegExp): AuthState {
  return records.some((record) => prefix.test(record)) ? 'configured' : 'missing';
}

async function auditDomain(domain: string, dkimSelector?: string) {
  const [rootTxt, dmarcTxt, dkimTxt] = await Promise.all([
    txtRecords(domain),
    txtRecords(`_dmarc.${domain}`),
    dkimSelector ? txtRecords(`${dkimSelector}._domainkey.${domain}`) : Promise.resolve([]),
  ]);

  return {
    domain,
    spf: stateFromRecord(rootTxt, /^v=spf1\b/i),
    dmarc: stateFromRecord(dmarcTxt, /^v=DMARC1\b/i),
    dkim: dkimSelector ? stateFromRecord(dkimTxt, /^v=DKIM1\b|\bp=/i) : 'unknown' as AuthState,
    dkimSelector: dkimSelector || null,
    note: dkimSelector
      ? 'DNS record presence was checked. This does not prove message-level authentication or alignment.'
      : 'SPF and DMARC record presence were checked. Provide a DKIM selector to check DKIM record presence.',
  };
}

export async function GET(request: NextRequest) {
  const domain = domainFrom(request.nextUrl.searchParams.get('domain') || '');
  const selector = text(request.nextUrl.searchParams.get('selector'), 120);
  if (!domain) {
    return NextResponse.json({ error: 'Provide a valid domain.' }, { status: 400, headers: NO_STORE });
  }

  const dns = await auditDomain(domain, selector || undefined);
  return NextResponse.json({ dns }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DeliverabilityInput & { domain?: unknown; dkimSelector?: unknown };
    const explicitDomain = domainFrom(text(body.domain, 254));
    const senderDomain = domainFrom(text(body.sender, 254));
    const domain = explicitDomain || senderDomain;
    const selector = text(body.dkimSelector, 120);

    let dns: Awaited<ReturnType<typeof auditDomain>> | null = null;
    let input: DeliverabilityInput = { ...body };

    if (domain) {
      dns = await auditDomain(domain, selector || undefined);
      input = {
        ...input,
        spf: input.spf || dns.spf,
        dmarc: input.dmarc || dns.dmarc,
        dkim: input.dkim || dns.dkim,
      };
    }

    const report = scoreDeliverability(input);
    return NextResponse.json({ report, dns }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to run deliverability preflight.' },
      { status: 400, headers: NO_STORE },
    );
  }
}
