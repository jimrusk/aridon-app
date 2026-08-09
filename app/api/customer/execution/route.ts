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
    const objective = text(body?.objective, 6000);
    const outputs = Array.isArray(body?.outputs) ? body.outputs.map((item: unknown) => text(item, 500)).filter(Boolean).slice(0, 12) : [];
    if (!slug || objective.length < 12) return NextResponse.json({ error: 'Workspace and a clear finished-project objective are required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });

    const company = await loadCustomerExecutiveContext(auth.db, membership.tenant);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'The AI service is not configured on this deployment.' }, { status: 503, headers: NO_STORE });

    const roster = executives.map((executive) => `${executive.name} | ${executive.role} | ${executive.focus}`).join('\n');
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.CUSTOMER_EXECUTION_MODEL?.trim() || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2400,
      messages: [
        { role: 'system', content: `You are Aridon's controlled Execution Team inside a customer's private workspace. Convert a finished-project objective into a decision-ready execution package using the relevant named executives.\n\nROSTER\n${roster}\n\nReturn JSON only with: {"projectName":"...","objective":"...","assignments":[{"executive":"...","responsibility":"...","deliverable":"..."}],"workplan":[{"step":1,"owner":"...","action":"...","doneWhen":"..."}],"draftDeliverables":[{"title":"...","content":"..."}],"assumptions":["..."],"risks":["..."],"approvalGates":["..."]}. Produce useful draft content where possible, but never claim external actions were completed. Never invent customer facts, contacts, prices, approvals, citations, certifications, or results. Respect the owner approval policy contained in the company context.` },
        { role: 'user', content: `CUSTOMER COMPANY CONTEXT\n${company.context}\n\nFINISHED-PROJECT OBJECTIVE\n${objective}\n\nREQUESTED OUTPUTS\n${outputs.length ? outputs.join('\n') : 'Choose the minimum useful deliverables needed to finish the objective.'}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const result = JSON.parse(raw);
    await auth.db.from('customer_usage_events').insert({ tenant_id: membership.tenant.id, user_id: auth.user.id, event_name: 'execution_team_run', event_data: { objective: objective.slice(0, 500) } });
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer execution error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The execution team is temporarily unavailable.' }, { status: 500, headers: NO_STORE });
  }
}
