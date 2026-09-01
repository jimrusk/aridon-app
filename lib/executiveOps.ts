import 'server-only';
import type { NextRequest } from 'next/server';
import { getServerClient } from './supabase';
import { GMAIL_EMAIL_COOKIE, GMAIL_REFRESH_COOKIE } from './gmail';
import { MS_EMAIL_COOKIE, MS_REFRESH_COOKIE } from './microsoft365';

export const EXECUTIVE_NAMES = [
  'Heather', 'Nova', 'Scout', 'Atlas', 'Oracle', 'Ethos', 'Ledger',
  'Sierra Bennett', 'Maya Torres', 'Claire Morgan', 'Eva',
] as const;

export type ExecutiveName = (typeof EXECUTIVE_NAMES)[number];

type RouteInput = { subject?: string; body?: string; from?: string; filename?: string };

const ROUTING_RULES: Array<{ executive: ExecutiveName; terms: string[] }> = [
  { executive: 'Ethos', terms: ['contract', 'nda', 'legal', 'lawsuit', 'compliance', 'regulatory', 'terms', 'agreement', 'liability', 'policy'] },
  { executive: 'Nova', terms: ['invoice', 'bank', 'cash flow', 'budget', 'financial', 'statement', 'tax', 'accounting', 'expense', 'balance sheet', 'p&l', 'profit and loss'] },
  { executive: 'Ledger', terms: ['sales', 'proposal', 'pricing', 'quote', 'customer', 'lead', 'revenue', 'pipeline', 'follow up', 'follow-up', 'deal'] },
  { executive: 'Atlas', terms: ['api', 'software', 'bug', 'technology', 'technical', 'engineering', 'code', 'integration', 'security', 'data'] },
  { executive: 'Sierra Bennett', terms: ['farm', 'ranch', 'agriculture', 'livestock', 'crop', 'producer', 'regenerative', 'soil'] },
  { executive: 'Maya Torres', terms: ['water', 'awg', 'energy', 'power', 'grid', 'microgrid', 'drought', 'infrastructure'] },
  { executive: 'Oracle', terms: ['marketing', 'press', 'media', 'brand', 'campaign', 'linkedin', 'newsletter', 'speaker', 'event'] },
  { executive: 'Claire Morgan', terms: ['research', 'diligence', 'background', 'verify', 'competitor', 'market intelligence', 'source'] },
  { executive: 'Scout', terms: ['strategy', 'partnership', 'acquisition', 'investor', 'capital partner', 'market entry', 'growth plan'] },
  { executive: 'Heather', terms: ['operations', 'project', 'deadline', 'schedule', 'team', 'deliverable', 'implementation'] },
];

export function recommendExecutive(input: RouteInput): { executive: ExecutiveName; reason: string } {
  const haystack = [input.subject, input.body, input.from, input.filename].filter(Boolean).join(' ').toLowerCase();
  let best: { executive: ExecutiveName; score: number; hits: string[] } | null = null;
  for (const rule of ROUTING_RULES) {
    const hits = rule.terms.filter((term) => haystack.includes(term));
    if (!best || hits.length > best.score) best = { executive: rule.executive, score: hits.length, hits };
  }
  if (best && best.score > 0) return { executive: best.executive, reason: `Matched ${best.hits.slice(0, 3).join(', ')}` };
  return { executive: 'Eva', reason: 'Cross-functional or no specialist signal detected' };
}

export function connectedExecutiveActor(request: NextRequest) {
  const googleToken = Boolean(request.cookies.get(GMAIL_REFRESH_COOKIE)?.value);
  const googleEmail = (request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '').trim().toLowerCase();
  if (googleToken && googleEmail) return { email: googleEmail, connected: true, provider: 'google' as const };

  const microsoftToken = Boolean(request.cookies.get(MS_REFRESH_COOKIE)?.value);
  const microsoftEmail = (request.cookies.get(MS_EMAIL_COOKIE)?.value || '').trim().toLowerCase();
  if (microsoftToken && microsoftEmail) return { email: microsoftEmail, connected: true, provider: 'microsoft' as const };

  return { email: '', connected: false, provider: null };
}

export async function externalActionsEnabled(request: NextRequest): Promise<boolean> {
  const actor = connectedExecutiveActor(request);
  if (!actor.connected) return false;
  try {
    const { data, error } = await getServerClient()
      .from('executive_ops_controls')
      .select('external_actions_enabled')
      .eq('actor_email', actor.email)
      .maybeSingle();
    if (error) throw error;
    return data?.external_actions_enabled !== false;
  } catch (error) {
    console.error('Executive Operations control lookup failed', error);
    return false;
  }
}

export async function setExternalActionsEnabled(actorEmail: string, enabled: boolean, updatedBy = 'owner') {
  const email = actorEmail.trim().toLowerCase();
  if (!email) throw new Error('Connected account email is required.');
  const { data, error } = await getServerClient()
    .from('executive_ops_controls')
    .upsert({ actor_email: email, external_actions_enabled: enabled, updated_at: new Date().toISOString(), updated_by: updatedBy }, { onConflict: 'actor_email' })
    .select('actor_email,external_actions_enabled,updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function auditExecutiveAction(input: {
  actorEmail?: string;
  executive?: string;
  action: string;
  channel: string;
  target?: string;
  approved?: boolean;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { error } = await getServerClient().from('executive_ops_audit').insert({
      actor_email: input.actorEmail?.trim().toLowerCase() || null,
      executive: input.executive || null,
      action: input.action,
      channel: input.channel,
      target: input.target || null,
      approved: input.approved === true,
      metadata: input.metadata || {},
    });
    if (error) throw error;
  } catch (error) {
    console.error('Executive Operations audit write failed', error);
  }
}

export async function recentExecutiveAudit(actorEmail: string, limit = 100) {
  const safeLimit = Math.max(1, Math.min(250, limit));
  const { data, error } = await getServerClient()
    .from('executive_ops_audit')
    .select('id,actor_email,executive,action,channel,target,approved,metadata,created_at')
    .eq('actor_email', actorEmail.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return data || [];
}
