import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { companySeed, executives } from '../../../lib/executives';

const NO_STORE = { 'Cache-Control': 'no-store' };

export type BoardroomResponse = {
  summary: string;
  team: Array<{
    name: string;
    role: string;
    position: string;
    actions: string[];
    risks: string[];
  }>;
  decision: string;
  nextActions: string[];
  approvalGates: string[];
};

function cleanText(value: unknown, max = 6000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function demoResponse(question: string): BoardroomResponse {
  return {
    summary: `The executive team would treat “${question.slice(0, 140)}” as a cross-functional decision, not a one-person answer.`,
    team: [
      { name: 'Heather', role: 'Chief Operating Officer', position: 'Define the operating objective, owner, deadline, dependencies, and what finished looks like.', actions: ['Turn the decision into a short execution plan', 'Assign one accountable owner'], risks: ['Unclear ownership', 'Too many priorities at once'] },
      { name: 'Nova', role: 'Chief Financial Officer', position: 'Put a cost, cash-flow effect, downside limit, and expected return around the move before committing.', actions: ['Set a spending or exposure ceiling', 'Define the financial success measure'], risks: ['Cash drain', 'Unpriced downside'] },
      { name: 'Ledger', role: 'Chief Revenue Officer', position: 'Tie the move to a buyer, pipeline stage, conversion event, or measurable revenue outcome.', actions: ['Name the commercial outcome', 'Set the next customer-facing milestone'], risks: ['Activity without revenue', 'Weak follow-up'] },
      { name: 'Ethos', role: 'Chief Legal & Risk Officer', position: 'Keep irreversible, external, financial, legal, or reputational actions behind a human approval gate.', actions: ['Document assumptions', 'Flag commitments requiring approval'], risks: ['Unapproved commitments', 'Claims that cannot be defended'] },
    ],
    decision: 'Move forward only after the goal, financial boundary, commercial outcome, owner, and approval gates are explicit.',
    nextActions: ['Write the one-sentence finished outcome', 'Set the budget or downside limit', 'Assign the owner and deadline', 'Run the first reversible step'],
    approvalGates: ['Sending external communications', 'Spending or committing funds', 'Signing or accepting terms', 'Publishing regulated, legal, financial, or technical claims'],
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const question = cleanText(body?.question, 5000);
    const companyContext = cleanText(body?.companyContext, 8000);
    const approvalPolicy = cleanText(body?.approvalPolicy, 3000);

    if (question.length < 8) {
      return NextResponse.json({ error: 'Give the executive team a real business question.' }, { status: 400, headers: NO_STORE });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ...demoResponse(question), demo: true }, { headers: NO_STORE });
    }

    const roster = executives.map((executive) => `${executive.name} | ${executive.role} | ${executive.focus}`).join('\n');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 1900,
      messages: [
        {
          role: 'system',
          content: `You are the Aridon Executive Boardroom. Aridon is an AI Executive Operating System. Route a business question across the relevant members of this named executive team and then synthesize one decision-ready answer.\n\nEXECUTIVE TEAM\n${roster}\n\nBASE COMPANY CONTEXT\n${companySeed}\n\nRULES\n- Use 3 to 6 executives, only where their specialty adds value.\n- Let executives disagree when useful. Do not produce eight repetitive opinions.\n- Be concrete, commercial, and action-oriented.\n- Label assumptions and never invent facts, contacts, contracts, approvals, financial results, certifications, or guarantees.\n- Preserve human approval for irreversible external actions, spending, signatures, legal commitments, and consequential claims.\n- Return valid JSON only with this shape: {"summary":"...","team":[{"name":"...","role":"...","position":"...","actions":["..."],"risks":["..."]}],"decision":"...","nextActions":["..."],"approvalGates":["..."]}.`,
        },
        {
          role: 'user',
          content: `BUSINESS QUESTION\n${question}\n\nOPTIONAL COMPANY CONTEXT\n${companyContext || 'No additional context provided.'}\n\nOWNER APPROVAL POLICY\n${approvalPolicy || 'Research, analysis, and drafting are allowed. External sends, financial commitments, signatures, and consequential claims require human approval.'}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    let parsed: BoardroomResponse;
    try {
      parsed = JSON.parse(raw) as BoardroomResponse;
    } catch {
      parsed = demoResponse(question);
    }

    return NextResponse.json(parsed, { headers: NO_STORE });
  } catch (error) {
    console.error('Boardroom route error', error);
    return NextResponse.json({ error: 'The executive boardroom could not complete this turn.' }, { status: 500, headers: NO_STORE });
  }
}
