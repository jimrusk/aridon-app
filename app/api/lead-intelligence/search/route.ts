import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

type Lead = {
  company: string;
  website: string;
  location: string;
  contactName: string;
  title: string;
  email?: string;
  phone?: string;
  signals: string[];
  score: number;
  whyNow: string;
  suggestedPitch: string;
  source: string;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreLead(input: Partial<Lead>) {
  const signals = Array.isArray(input.signals) ? input.signals : [];
  let score = 42;
  if (input.email) score += 12;
  if (input.phone) score += 8;
  if (input.contactName) score += 8;
  if (input.title) score += 8;
  if (input.website) score += 5;
  score += Math.min(signals.length * 5, 20);
  return clamp(score);
}

function normalizeLead(raw: any): Lead {
  const signals = Array.isArray(raw?.signals)
    ? raw.signals.map((value: unknown) => String(value)).slice(0, 8)
    : [];

  const lead: Lead = {
    company: String(raw?.company || raw?.companyName || 'Unknown company').slice(0, 180),
    website: String(raw?.website || raw?.domain || '').slice(0, 300),
    location: String(raw?.location || '').slice(0, 180),
    contactName: String(raw?.contactName || raw?.name || '').slice(0, 180),
    title: String(raw?.title || raw?.jobTitle || '').slice(0, 180),
    email: raw?.email ? String(raw.email).slice(0, 240) : undefined,
    phone: raw?.phone ? String(raw.phone).slice(0, 80) : undefined,
    signals,
    score: 0,
    whyNow: String(raw?.whyNow || raw?.reason || 'Relevant fit based on available firmographic and intent signals.').slice(0, 500),
    suggestedPitch: String(raw?.suggestedPitch || raw?.pitch || 'Lead with the business outcome that best matches the detected need, then ask for a short discovery call.').slice(0, 700),
    source: String(raw?.source || 'Connected lead provider').slice(0, 120),
  };

  lead.score = typeof raw?.score === 'number' ? clamp(raw.score) : scoreLead(lead);
  return lead;
}

function demoLeads(industry: string, geography: string, need: string, role: string): Lead[] {
  const geo = geography || 'Target market';
  const sector = industry || 'growth-stage business';
  const pain = need || 'revenue growth and customer acquisition';
  const buyer = role || 'Owner / CEO';

  const rows = [
    {
      company: 'Mesa Ridge Services',
      website: 'https://example.com',
      location: geo,
      contactName: 'Sample Decision Maker',
      title: buyer,
      signals: ['Hiring growth', 'Website conversion gap', 'Recent expansion'],
      whyNow: `Public growth signals suggest a near-term need around ${pain}.`,
      suggestedPitch: `Open with the expansion signal, quantify the cost of missed demand, and position Aridon as the operating layer that finds, qualifies, and follows up with buyers automatically.`,
    },
    {
      company: 'Northstar Industrial Group',
      website: 'https://example.org',
      location: geo,
      contactName: 'Sample Operations Lead',
      title: buyer,
      signals: ['New market entry', 'Thin sales coverage', 'High-value B2B offer'],
      whyNow: `The company profile fits ${sector} and appears exposed to pipeline risk while entering new markets.`,
      suggestedPitch: `Lead with pipeline coverage and buyer-intent monitoring, then offer a 30-day revenue-opportunity scan.`,
    },
    {
      company: 'Canyon Peak Solutions',
      website: 'https://example.net',
      location: geo,
      contactName: 'Sample Growth Executive',
      title: buyer,
      signals: ['Active recruiting', 'Multiple service lines', 'Weak proof-to-CTA path'],
      whyNow: `Multiple growth signals make ${pain} a plausible priority.`,
      suggestedPitch: `Show how Aridon connects public demand signals to verified contacts, personalized outreach, follow-up, and CRM tracking in one workflow.`,
    },
  ];

  return rows.map((row, index) => normalizeLead({ ...row, source: 'Aridon demo data', score: 92 - index * 7 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const industry = typeof body?.industry === 'string' ? body.industry.trim().slice(0, 180) : '';
    const geography = typeof body?.geography === 'string' ? body.geography.trim().slice(0, 180) : '';
    const need = typeof body?.need === 'string' ? body.need.trim().slice(0, 300) : '';
    const role = typeof body?.role === 'string' ? body.role.trim().slice(0, 180) : '';

    if (!industry && !geography && !need) {
      return NextResponse.json({ error: 'Enter at least an industry, geography, or business need.' }, { status: 400, headers: NO_STORE });
    }

    const providerUrl = process.env.ARIDON_LEAD_PROVIDER_URL?.trim();
    const providerKey = process.env.ARIDON_LEAD_PROVIDER_KEY?.trim();

    if (providerUrl && providerKey) {
      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({ industry, geography, need, role, limit: 25 }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        return NextResponse.json({ error: `Lead provider returned ${response.status}.`, detail: detail.slice(0, 500) }, { status: 502, headers: NO_STORE });
      }

      const data = await response.json().catch(() => ({}));
      const rawLeads = Array.isArray(data) ? data : Array.isArray(data?.leads) ? data.leads : [];
      const leads = rawLeads.map(normalizeLead).sort((a: Lead, b: Lead) => b.score - a.score).slice(0, 25);

      return NextResponse.json({ mode: 'live', leads, searchedAt: new Date().toISOString() }, { headers: NO_STORE });
    }

    return NextResponse.json({
      mode: 'demo',
      message: 'Lead Intelligence is installed. Connect a licensed data provider with ARIDON_LEAD_PROVIDER_URL and ARIDON_LEAD_PROVIDER_KEY to return live contacts.',
      leads: demoLeads(industry, geography, need, role),
      searchedAt: new Date().toISOString(),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('lead-intelligence search failed', error);
    return NextResponse.json({ error: 'Lead search failed.' }, { status: 500, headers: NO_STORE });
  }
}
