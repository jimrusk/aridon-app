import 'server-only';

import { actionAdapterDefinition, normalizeActionAdapterKey, type ActionAdapterKey } from './actionFabric';
import type { AridonMode } from './modelRouter';

export type BrainActionProposal = {
  adapterKey: ActionAdapterKey;
  title: string;
  payload: Record<string, unknown>;
  rationale: string;
  expectedOutcome: string;
  riskLevel: 'low' | 'medium' | 'high';
  approvalRequired: boolean;
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function objectPayload(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function validDate(value: string) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

export function normalizeBrainMode(value: unknown, legacyResearch = false): AridonMode {
  const mode = text(value, 20).toLowerCase();
  if (mode === 'think' || mode === 'research' || mode === 'act' || mode === 'fast') return mode;
  if (legacyResearch) return 'research';
  return 'fast';
}

export function actModeSystemContract() {
  return `\n\nACT MODE CONTRACT:\nWhen there is a clear next executable step, append exactly one machine-readable block after the user-facing answer:\n<aridon_action>{"adapterKey":"internal_task|email_send|calendar_create|manual","title":"...","payload":{},"rationale":"...","expectedOutcome":"...","riskLevel":"low|medium|high","approvalRequired":true}</aridon_action>\nRules for that block:\n- Never invent an email address, recipient, date, time, amount, legal commitment, or external destination.\n- email_send requires an exact known recipient email plus subject and body. Otherwise use manual.\n- calendar_create requires exact start and end datetimes. Otherwise use manual.\n- internal_task is for reversible work inside Aridon.\n- manual is the safe fallback when a connected execution adapter or required detail is missing.\n- External actions always set approvalRequired to true.\n- The user-facing answer must never claim the queued action already executed.`;
}

export function stripActionMarker(value: string) {
  return value.replace(/\s*<aridon_action>[\s\S]*?<\/aridon_action>\s*/gi, '').trim();
}

function safeManualFallback(latestRequest: string, reason: string): BrainActionProposal {
  const request = text(latestRequest, 1600);
  return {
    adapterKey: 'manual',
    title: text(request ? `Follow through on: ${request}` : 'Review requested action', 500),
    payload: { request },
    rationale: reason,
    expectedOutcome: 'Resolve the missing execution detail or connection, then continue through Action Fabric.',
    riskLevel: 'medium',
    approvalRequired: true,
  };
}

export function parseBrainAction(raw: string, latestRequest: string): BrainActionProposal | null {
  const match = raw.match(/<aridon_action>([\s\S]*?)<\/aridon_action>/i);
  if (!match?.[1]) return null;

  let parsed: any;
  try { parsed = JSON.parse(match[1].trim()); } catch {
    return safeManualFallback(latestRequest, 'Act mode identified work to do, but the structured execution payload could not be validated.');
  }

  const requestedKey = normalizeActionAdapterKey(parsed?.adapterKey, parsed?.actionType);
  const title = text(parsed?.title, 500) || text(latestRequest, 500) || 'Aridon action';
  const payload = objectPayload(parsed?.payload);
  const rationale = text(parsed?.rationale, 2500) || 'Prepared from the current Act mode request.';
  const expectedOutcome = text(parsed?.expectedOutcome, 1200);
  const risk = text(parsed?.riskLevel, 20).toLowerCase();
  const riskLevel: 'low' | 'medium' | 'high' = risk === 'high' ? 'high' : risk === 'low' ? 'low' : 'medium';

  if (requestedKey === 'email_send') {
    const to = text(payload.to, 254);
    const subject = text(payload.subject, 300);
    const body = text(payload.body, 50_000);
    if (!validEmail(to) || !subject || !body) {
      return safeManualFallback(latestRequest, 'Email execution is held because an exact recipient, subject, or body is missing.');
    }
    return { adapterKey: 'email_send', title, payload: { ...payload, to, subject, body }, rationale, expectedOutcome, riskLevel: riskLevel === 'low' ? 'medium' : riskLevel, approvalRequired: true };
  }

  if (requestedKey === 'calendar_create') {
    const start = text(payload.start, 100);
    const end = text(payload.end, 100);
    if (!validDate(start) || !validDate(end) || Date.parse(end) <= Date.parse(start)) {
      return safeManualFallback(latestRequest, 'Calendar execution is held because exact valid start and end times are missing.');
    }
    const attendees = Array.isArray(payload.attendees)
      ? payload.attendees.map((value) => text(value, 254)).filter(validEmail).slice(0, 50)
      : [];
    return { adapterKey: 'calendar_create', title, payload: { ...payload, start, end, attendees }, rationale, expectedOutcome, riskLevel: riskLevel === 'low' ? 'medium' : riskLevel, approvalRequired: true };
  }

  if (requestedKey === 'internal_task') {
    const owner = text(payload.owner, 160) || 'Eva';
    const priorityRaw = text(payload.priority, 30).toLowerCase();
    const priority = ['low', 'medium', 'high', 'urgent'].includes(priorityRaw) ? priorityRaw : 'medium';
    return {
      adapterKey: 'internal_task',
      title,
      payload: { ...payload, title: text(payload.title, 500) || title, owner, priority },
      rationale,
      expectedOutcome,
      riskLevel,
      approvalRequired: parsed?.approvalRequired === true,
    };
  }

  const adapter = actionAdapterDefinition('manual');
  return {
    adapterKey: adapter.key,
    title,
    payload: Object.keys(payload).length ? payload : { request: text(latestRequest, 1600) },
    rationale,
    expectedOutcome,
    riskLevel,
    approvalRequired: true,
  };
}

const SENSITIVE_MEMORY = /(password|passcode|secret|api[ _-]?key|access[ _-]?token|refresh[ _-]?token|private key|social security|\bssn\b|credit card|cvv|security answer)/i;
const DURABLE_MEMORY = /(remember|from now on|always|never|we decided|we chose|approved|our goal|our target|deadline|my preference|i prefer|i want|we want|we need|our plan|make sure|do not|don't)/i;

export function shouldCaptureMemory(value: string) {
  const cleaned = text(value, 4000);
  if (!cleaned || cleaned.length < 8 || SENSITIVE_MEMORY.test(cleaned)) return false;
  return DURABLE_MEMORY.test(cleaned);
}

export function memoryTypeFor(value: string) {
  const lower = value.toLowerCase();
  if (/(prefer|always|never|from now on|do not|don't)/.test(lower)) return 'preference';
  if (/(decided|chose|approved)/.test(lower)) return 'decision';
  if (/(goal|target|deadline|plan|we need|we want|i want)/.test(lower)) return 'objective';
  return 'continuity';
}

export function memorySummary(value: string) {
  return text(value.replace(/\s+/g, ' '), 900);
}
