import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { loadCustomerExecutiveContext } from '../../../../lib/customerExecutiveContext';
import { executives } from '../../../../lib/executives';

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
    const question = text(body?.question, 6000);
    if (!slug || question.length < 8) return NextResponse.json({ error: 'Workspace and a real business question are required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const company = await loadCustomerExecutiveContext(auth.db, membership.tenant);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const roster = executives.map((executive) => `${executive.name} | ${executive.role} | ${executive.focus}`).join('\n');
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.CUSTOMER_BOARDROOM_MODEL?.trim() || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 1900,
      messages: [
        { role: 'system', content: `You are the Aridon Executive Boardroom inside a customer's private Business OS. Use only the customer's supplied company context. Route the decision to 3 to 6 relevant executives from this roster:\n${roster}\n\nReturn JSON only: {"summary":"...","team":[{"name":"...","role":"...","position":"...","actions":["..."],"risks":["..."]}],"decision":"...","nextActions":["..."],"approvalGates":["..."]}. Surface useful disagreement. Never invent customer facts, results, approvals, certifications, contacts, or guarantees. Respect the owner's approval policy in the company context.` },
        { role: 'user', content: `CUSTOMER COMPANY CONTEXT\n${company.context}\n\nBOARDROOM QUESTION\n${question}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const result = JSON.parse(raw);
    await auth.db.from('customer_usage_events').insert({ tenant_id: membership.tenant.id, user_id: auth.user.id, event_name: 'executive_boardroom_run', event_data: { question: question.slice(0, 500) } });
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer boardroom error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The executive boardroom is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
