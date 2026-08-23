import { routeModel, type AridonChatMessage, type RouterResult } from './modelRouter';

export type AgentRisk = 'low' | 'medium' | 'high';

export type AgentPlanStep = {
  order: number;
  specialist: string;
  task: string;
  suggestedTool: string;
  riskLevel: AgentRisk;
  approvalRequired: boolean;
};

export type AgentPlan = {
  objective: string;
  successCriteria: string[];
  steps: AgentPlanStep[];
};

export type SpecialistResult = {
  step: AgentPlanStep;
  output: string;
  routing: RouterResult['routing'];
  attempts: number;
  qualityScore?: number;
  qualityNotes?: string;
};

export type QualityReview = {
  score: number;
  notes: string;
};

function jsonObject(value: string) {
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try {
    return JSON.parse(value.slice(first, last + 1));
  } catch {
    return null;
  }
}

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function risk(value: unknown): AgentRisk {
  return value === 'high' || value === 'medium' ? value : 'low';
}

function normalizePlan(raw: any, objective: string): AgentPlan {
  const steps = Array.isArray(raw?.steps)
    ? raw.steps
        .slice(0, 4)
        .map((step: any, index: number) => ({
          order: index + 1,
          specialist: clean(step?.specialist, 60) || ['Scout', 'Atlas', 'Ledger', 'Oracle'][index] || 'Eva',
          task: clean(step?.task, 700) || `Complete the specialist portion of: ${objective}`,
          suggestedTool: clean(step?.suggestedTool, 80) || 'company_brain',
          riskLevel: risk(step?.riskLevel),
          approvalRequired: Boolean(step?.approvalRequired),
        }))
        .filter((step: AgentPlanStep) => Boolean(step.task))
    : [];

  return {
    objective: clean(raw?.objective, 1000) || objective,
    successCriteria: Array.isArray(raw?.successCriteria)
      ? raw.successCriteria.map((item: unknown) => clean(item, 240)).filter(Boolean).slice(0, 6)
      : ['Answer the objective directly', 'Separate facts from assumptions', 'Produce clear next actions', 'Do not execute consequential actions without approval'],
    steps: steps.length
      ? steps
      : [
          { order: 1, specialist: 'Scout', task: `Identify the evidence, facts, unknowns, and information gaps for: ${objective}`, suggestedTool: 'company_brain', riskLevel: 'low', approvalRequired: false },
          { order: 2, specialist: 'Eva', task: `Develop the strongest strategy and options for: ${objective}`, suggestedTool: 'execution_engine', riskLevel: 'low', approvalRequired: false },
          { order: 3, specialist: 'Oracle', task: `Stress-test the proposed direction, risks, assumptions, and approval boundaries for: ${objective}`, suggestedTool: 'execution_engine', riskLevel: 'medium', approvalRequired: false },
        ],
  };
}

export async function buildAgentPlan(objective: string, context: string) {
  const prompt = `You are the Aridon Supervisor. Decompose the objective into the smallest useful specialist plan.\n\nOBJECTIVE:\n${objective}\n\nAVAILABLE CONTEXT:\n${context.slice(0, 26000)}\n\nAridon specialists: Heather (operations/orchestration), Eva (strategy), Scout (research/evidence), Atlas (technical), Ledger (finance/commercial), Nova (systems/assembly), Oracle (quality/risk), Ethos (governance/people).\nAvailable tool keys: company_brain, web_research, website_analyzer, acquisition_engine, presentation_studio, execution_engine, email_queue, crm, external_connector.\n\nReturn ONLY JSON:\n{\n  \"objective\": \"...\",\n  \"successCriteria\": [\"...\"],\n  \"steps\": [\n    {\"specialist\":\"Scout\",\"task\":\"...\",\"suggestedTool\":\"company_brain\",\"riskLevel\":\"low\",\"approvalRequired\":false}\n  ]\n}\n\nRules: maximum 4 steps. Use approvalRequired=true for sending messages, committing money, changing external systems, publishing, deleting, signing, purchasing, or other consequential actions. Research, analysis, drafting, and recommendations do not require approval. Do not create fake tools.`;

  const result = await routeModel(
    [{ role: 'user', content: prompt }],
    'You are Aridon Supervisor, a bounded workflow planner. Return only the requested JSON and preserve human approval boundaries.',
  );
  return { plan: normalizePlan(jsonObject(result.text), objective), routing: result.routing };
}

function specialistSystem(step: AgentPlanStep) {
  const lanes: Record<string, string> = {
    Heather: 'operations, orchestration, sequencing, ownership and execution design',
    Eva: 'strategy, positioning, business choices and synthesis',
    Scout: 'research, evidence, current information, fact checking and information gaps',
    Atlas: 'technical design, engineering logic, implementation and systems constraints',
    Ledger: 'financial logic, commercial structure, pricing, unit economics and deal economics',
    Nova: 'systems integration, assembly, workflow design and turning pieces into an operating package',
    Oracle: 'quality control, risk, unsupported assumptions, failure modes and decision gates',
    Ethos: 'governance, stakeholder impact, permissions, policy and human factors',
  };
  const lane = lanes[step.specialist] || 'specialist analysis';
  return `You are ${step.specialist}, an Aridon specialist focused on ${lane}. Complete only the assigned task. Use supplied context. Distinguish verified facts from inference. Never claim an external action was executed. If the step implies a consequential action, draft or recommend it and leave execution behind human approval.`;
}

export async function runSpecialist(step: AgentPlanStep, objective: string, context: string, previousOutputs = ''): Promise<SpecialistResult> {
  const messages: AridonChatMessage[] = [{
    role: 'user',
    content: `MASTER OBJECTIVE:\n${objective}\n\nYOUR ASSIGNMENT:\n${step.task}\n\nSUGGESTED TOOL/WORKFLOW:\n${step.suggestedTool}\n\nTENANT / PROJECT CONTEXT:\n${context.slice(0, 23000)}\n\nOTHER SPECIALIST OUTPUTS IF ANY:\n${previousOutputs.slice(0, 9000)}\n\nDeliver a concise specialist result with findings, assumptions/unknowns, and recommended next move.`,
  }];
  const result = await routeModel(messages, specialistSystem(step));
  return { step, output: result.text, routing: result.routing, attempts: 1 };
}

export async function judgeSpecialistResults(objective: string, successCriteria: string[], results: SpecialistResult[]) {
  const compact = results.map((result) => ({
    order: result.step.order,
    specialist: result.step.specialist,
    task: result.step.task,
    output: result.output.slice(0, 6500),
  }));
  const prompt = `Act as Aridon's independent quality judge. Score each specialist result against the master objective and success criteria.\n\nOBJECTIVE: ${objective}\nSUCCESS CRITERIA: ${successCriteria.join(' | ')}\nRESULTS: ${JSON.stringify(compact)}\n\nReturn ONLY JSON:\n{\"reviews\":[{\"order\":1,\"score\":0,\"notes\":\"specific fix needed\"}]}\n\nScore 0-100. Below 70 means the step should be retried. Penalize invented facts, failure to answer the assignment, missing approval boundaries, vague filler, or recommendations unsupported by available evidence.`;
  const result = await routeModel(
    [{ role: 'user', content: prompt }],
    'You are Oracle, Aridon independent quality control. Return only the requested JSON.',
  );
  const parsed = jsonObject(result.text);
  const reviews = new Map<number, QualityReview>();
  if (Array.isArray(parsed?.reviews)) {
    parsed.reviews.forEach((item: any) => {
      const order = Number(item?.order);
      if (!Number.isFinite(order)) return;
      const score = Math.max(0, Math.min(100, Number(item?.score) || 0));
      reviews.set(order, { score, notes: clean(item?.notes, 600) || 'No quality notes supplied.' });
    });
  }
  return { reviews, routing: result.routing };
}

export async function retrySpecialist(result: SpecialistResult, objective: string, context: string, qualityNotes: string) {
  const message = `MASTER OBJECTIVE:\n${objective}\n\nASSIGNMENT:\n${result.step.task}\n\nYOUR FIRST ATTEMPT:\n${result.output.slice(0, 9000)}\n\nQUALITY REVIEW:\n${qualityNotes}\n\nRewrite the result to directly fix the quality review. Keep good material, remove unsupported claims, and make the answer decision-ready.`;
  const retried = await routeModel([{ role: 'user', content: message }], specialistSystem(result.step));
  return { ...result, output: retried.text, routing: retried.routing, attempts: result.attempts + 1 };
}

export async function synthesizeAgentRun(objective: string, successCriteria: string[], results: SpecialistResult[], context: string) {
  const combined = results
    .map((result) => `### ${result.step.specialist} · ${result.step.task}\nQuality: ${result.qualityScore ?? 'not scored'}/100\n${result.output}`)
    .join('\n\n')
    .slice(0, 28000);
  const prompt = `Synthesize the completed Aridon specialist work into one answer.\n\nOBJECTIVE:\n${objective}\n\nSUCCESS CRITERIA:\n${successCriteria.map((item) => `- ${item}`).join('\n')}\n\nCONTEXT:\n${context.slice(0, 9000)}\n\nSPECIALIST WORK:\n${combined}\n\nReturn a decision-ready final output. Reconcile conflicts between specialists. Separate verified facts, inference, and unknowns when relevant. Make the next actions clear. Any consequential external action must be labeled as waiting for human approval.`;
  return routeModel(
    [{ role: 'user', content: prompt }],
    'You are Heather and Eva jointly assembling the final Aridon supervisor result. Be practical, accurate, decisive, and explicit about approval-gated actions.',
  );
}
