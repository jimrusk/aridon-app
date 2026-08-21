import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerClient } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function fallbackStrategy(lead: any) {
  const reason = lead.reason_for_sale || 'not yet confirmed';
  const priorities = lead.seller_priorities || 'not yet confirmed';
  return {
    executiveSummary: `${lead.business_name} should be treated as a structured acquisition process, not a price-only negotiation. Verify earnings, seller motivation, transferability, and financing before increasing commitment.`,
    sellerPersona: lead.owner_urgency >= 4 ? 'motivated seller' : 'information-seeking seller',
    sellerRead: `Known reason for sale: ${reason}. Known seller priorities: ${priorities}. Treat both as hypotheses until confirmed directly.`,
    openingTone: 'Curious, respectful, low-pressure, and focused on fit before terms.',
    leveragePoints: [
      lead.listing_age_days >= 180 ? 'Long market exposure may support timing flexibility.' : 'Do not assume timing pressure from listing age yet.',
      lead.seller_finance_willingness >= 50 ? 'Seller financing appears to be a meaningful structuring lever.' : 'Seller financing may require trust-building or a stronger headline trade.',
      lead.competition_level <= 2 ? 'Limited visible buyer competition improves patience and optionality.' : 'Visible competition means avoid unnecessary delay and keep diligence organized.',
    ],
    probingQuestions: [
      'What would make this a successful transition for you besides the headline price?',
      'Why is now the right time to sell?',
      'What part of the business is most dependent on you personally?',
      'What would make you comfortable carrying part of the purchase price?',
      'What has caused prior buyers to hesitate or walk away, if any?',
    ],
    concessionTrades: [
      'If price goes up, ask for more seller financing or a performance condition.',
      'If cash at close goes up, ask for stronger representations, training, or working-capital support.',
      'If diligence is shortened, ask for earlier and more complete document delivery.',
      'If exclusivity is granted, tie it to prompt seller cooperation and defined milestones.',
    ],
    negotiationSequence: [
      'Confirm motivation and non-price priorities.',
      'Verify normalized earnings and major liabilities.',
      'Present two or three structures rather than one take-it-or-leave-it price.',
      'Trade concessions instead of giving them away.',
      'Document business terms in an LOI only after the economics are internally approved.',
    ],
    walkAwayTriggers: [
      'Material earnings cannot be reconciled to source documents.',
      'Undisclosed liabilities or legal problems materially change value.',
      'Seller will not provide reasonable diligence access.',
      'Required cash, debt service, or guarantees exceed the approved risk boundary.',
    ],
    approvalGates: ['External outreach', 'Final valuation', 'LOI release', 'Financing commitment', 'Signature or binding commitment', 'Final close / walk-away decision'],
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('acquisition_strategies').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ strategy: data?.strategy ?? null, created_at: data?.created_at ?? null }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition strategy GET error', error);
    return NextResponse.json({ error: 'Unable to load the deal strategy.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getServerClient();
    const { data: lead, error } = await db.from('acquisition_leads').select('*').eq('id', params.id).single();
    if (error || !lead) throw error || new Error('Lead not found');
    const { data: score } = await db.from('acquisition_scores').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: structures } = await db.from('acquisition_structures').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }).limit(5);

    let strategy = fallbackStrategy(lead);
    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 1700,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are Aridon 3 Acquisition Strategy. Produce practical small-business acquisition strategy without manipulation, deception, invented facts, legal conclusions, or financing promises. Treat seller psychology as a hypothesis, not a diagnosis. Preserve human approval for outreach, valuation, LOIs, financing commitments, signatures, and closing. Return JSON with keys executiveSummary, sellerPersona, sellerRead, openingTone, leveragePoints, probingQuestions, concessionTrades, negotiationSequence, walkAwayTriggers, approvalGates. Array fields must be arrays of concise strings.',
          },
          {
            role: 'user',
            content: JSON.stringify({ lead, latestScore: score ?? null, currentStructures: structures ?? [] }),
          },
        ],
      });
      try {
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        if (parsed?.executiveSummary) strategy = { ...strategy, ...parsed };
      } catch {
        console.error('Acquisition strategy JSON parse failed; using fallback');
      }
    }

    const { error: saveError } = await db.from('acquisition_strategies').insert({ lead_id: params.id, strategy });
    if (saveError) throw saveError;
    if (lead.stage === 'qualified') {
      await db.from('acquisition_leads').update({ stage: 'contact_strategy_ready', updated_at: new Date().toISOString() }).eq('id', params.id);
    }
    await db.from('acquisition_timeline').insert({ lead_id: params.id, event_type: 'strategy_generated', event_title: 'Negotiation strategy generated', event_detail: strategy.executiveSummary, created_by: 'Aridon 3' });
    return NextResponse.json({ strategy }, { headers: NO_STORE });
  } catch (error) {
    console.error('Acquisition strategy POST error', error);
    return NextResponse.json({ error: 'Unable to generate the acquisition strategy.' }, { status: 500, headers: NO_STORE });
  }
}
