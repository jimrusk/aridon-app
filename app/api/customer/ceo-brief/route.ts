import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { loadCustomerExecutiveContext } from '../../../../lib/customerExecutiveContext';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = text(body?.slug, 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const company = await loadCustomerExecutiveContext(auth.db, membership.tenant);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.CUSTOMER_BRIEF_MODEL?.trim() || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.25,
      max_tokens: 1300,
      messages: [
        { role: 'system', content: 'You are Eva, AI Command Advisor and Chief of Staff inside a customer\'s private Aridon Business OS. Turn the supplied company snapshot into a concise owner briefing. Return JSON only with: headline, summary, priorities (exactly 3), revenue, operations, risks (array), opportunities (array), nextActions (exactly 3). Never invent missing facts, deadlines, financial results, customer activity, or external events. State missing data rather than guessing.' },
        { role: 'user', content: `CUSTOMER COMPANY SNAPSHOT\n${company.context}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const result = JSON.parse(raw);
    await auth.db.from('customer_usage_events').insert({ tenant_id: membership.tenant.id, user_id: auth.user.id, event_name: 'ceo_brief_generated', event_data: {} });
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer CEO brief error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The CEO brief is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
