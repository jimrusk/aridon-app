import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getDirectIntegration } from './directIntegrations';

export const DIRECT_ACTION_ADAPTERS = [
  {
    key: 'crm_lead_create',
    label: 'Create CRM lead',
    category: 'internal',
    requiresApproval: false,
    connection: 'none',
    description: 'Creates a tenant-scoped researched lead inside Aridon Scout CRM.',
  },
  {
    key: 'knowledge_save',
    label: 'Save to Knowledge Vault',
    category: 'internal',
    requiresApproval: false,
    connection: 'none',
    description: 'Saves a durable research note into the customer Knowledge Vault.',
  },
  {
    key: 'github_issue_create',
    label: 'Create approved GitHub issue',
    category: 'external',
    requiresApproval: true,
    connection: 'github',
    description: 'Creates an issue in the connected GitHub repository after owner approval.',
  },
  {
    key: 'vercel_deploy_hook',
    label: 'Trigger approved Vercel deploy',
    category: 'external',
    requiresApproval: true,
    connection: 'vercel_hook',
    description: 'Triggers the connected Vercel Deployment Hook after owner approval.',
  },
] as const;

export type DirectActionAdapterKey = (typeof DIRECT_ACTION_ADAPTERS)[number]['key'];

export type DirectActionRecord = {
  id: string;
  tenant_id: string;
  executive: string;
  title: string;
  payload: Record<string, unknown> | null;
};

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function payloadFor(action: DirectActionRecord) {
  return action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload)
    ? action.payload
    : {};
}

function validRepo(value: string) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

export function normalizeDirectActionAdapterKey(value: unknown, actionType?: unknown): DirectActionAdapterKey | null {
  const requested = text(value, 80).toLowerCase();
  const exact = DIRECT_ACTION_ADAPTERS.find((item) => item.key === requested);
  if (exact) return exact.key;
  const type = text(actionType, 80).toLowerCase();
  if (/^(crm|lead|crm_lead|crm_lead_create|save_lead)$/.test(type)) return 'crm_lead_create';
  if (/^(knowledge|knowledge_save|save_knowledge|vault|knowledge_vault)$/.test(type)) return 'knowledge_save';
  if (/^(github|github_issue|github_issue_create|create_issue)$/.test(type)) return 'github_issue_create';
  if (/^(vercel|deploy|vercel_deploy|vercel_deploy_hook)$/.test(type)) return 'vercel_deploy_hook';
  return null;
}

export function directActionDefinition(key: DirectActionAdapterKey) {
  return DIRECT_ACTION_ADAPTERS.find((item) => item.key === key)!;
}

export async function createGitHubIssue(db: SupabaseClient, action: DirectActionRecord) {
  const integration = await getDirectIntegration({ db, tenantId: action.tenant_id, provider: 'github' });
  if (!integration) throw new Error('GitHub is not connected for this workspace.');
  const payload = payloadFor(action);
  const metadata = integration.metadata && typeof integration.metadata === 'object' ? integration.metadata as Record<string, unknown> : {};
  const repository = text(payload.repository, 240) || text(metadata.defaultRepo, 240);
  const title = text(payload.title, 256) || action.title;
  const body = text(payload.body, 60_000);
  if (!validRepo(repository) || !title) throw new Error('GitHub issue actions require repository owner/name and a title.');

  const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.secret}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Aridon-Eva',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body: body || undefined }),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.html_url) throw new Error(result?.message || `GitHub returned ${response.status}.`);
  return {
    adapter: 'github_issue_create', provider: 'github', created: true,
    repository, issueNumber: result.number, url: result.html_url, title,
    completedAt: new Date().toISOString(),
  };
}

export async function triggerVercelDeployHook(db: SupabaseClient, action: DirectActionRecord) {
  const integration = await getDirectIntegration({ db, tenantId: action.tenant_id, provider: 'vercel_hook' });
  if (!integration) throw new Error('Vercel Deployment Hook is not connected for this workspace.');
  const response = await fetch(integration.secret, { method: 'POST', cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error?.message || result?.message || `Vercel Deployment Hook returned ${response.status}.`);
  return {
    adapter: 'vercel_deploy_hook', provider: 'vercel', triggered: true,
    project: (integration.metadata as any)?.projectName || integration.label || '',
    jobId: result?.job?.id || result?.id || '',
    completedAt: new Date().toISOString(),
  };
}

export async function createCrmLead(db: SupabaseClient, action: DirectActionRecord) {
  const payload = payloadFor(action);
  const companyName = text(payload.companyName, 300) || text(payload.company_name, 300);
  if (!companyName) throw new Error('CRM lead actions require a company name.');
  const fitScoreRaw = Number(payload.fitScore ?? payload.fit_score ?? 0);
  const fitScore = Number.isFinite(fitScoreRaw) ? Math.max(0, Math.min(100, Math.round(fitScoreRaw))) : 0;
  const sourceUrls = Array.isArray(payload.sourceUrls)
    ? payload.sourceUrls.map((item) => text(item, 2000)).filter(Boolean).slice(0, 20)
    : [];
  const { data, error } = await db.from('customer_sales_leads').insert({
    tenant_id: action.tenant_id,
    company_name: companyName,
    website: text(payload.website, 2000) || null,
    location: text(payload.location, 500) || null,
    contact_name: text(payload.contactName ?? payload.contact_name, 300) || null,
    contact_email: text(payload.contactEmail ?? payload.contact_email, 320) || null,
    contact_title: text(payload.contactTitle ?? payload.contact_title, 300) || null,
    recommended_buyer_role: text(payload.recommendedBuyerRole, 300) || null,
    fit_score: fitScore,
    fit_reason: text(payload.fitReason, 3000) || null,
    trigger_event: text(payload.triggerEvent, 2000) || null,
    research_notes: text(payload.researchNotes, 10_000) || null,
    personalization: text(payload.personalization, 5000) || null,
    source_urls: sourceUrls,
    source_type: 'eva_cloud_worker',
    status: 'researched',
  }).select('id,company_name,website,location,contact_name,contact_email,fit_score,status,created_at').single();
  if (error) throw error;
  return { adapter: 'crm_lead_create', created: true, lead: data, completedAt: new Date().toISOString() };
}

export async function saveKnowledge(db: SupabaseClient, action: DirectActionRecord) {
  const payload = payloadFor(action);
  const title = text(payload.title, 500) || action.title;
  const content = text(payload.content, 80_000);
  const category = text(payload.category, 200) || 'Eva Cloud Worker';
  if (!title || !content) throw new Error('Knowledge actions require a title and content.');
  const { data, error } = await db.from('customer_knowledge').insert({
    tenant_id: action.tenant_id,
    title,
    category,
    content,
  }).select('id,title,category,created_at').single();
  if (error) throw error;
  return { adapter: 'knowledge_save', created: true, knowledge: data, completedAt: new Date().toISOString() };
}

export async function executeDirectActionAdapter(input: {
  db: SupabaseClient;
  key: DirectActionAdapterKey;
  action: DirectActionRecord;
}) {
  switch (input.key) {
    case 'crm_lead_create': return createCrmLead(input.db, input.action);
    case 'knowledge_save': return saveKnowledge(input.db, input.action);
    case 'github_issue_create': return createGitHubIssue(input.db, input.action);
    case 'vercel_deploy_hook': return triggerVercelDeployHook(input.db, input.action);
  }
}
