import { createHash, randomUUID } from 'crypto';
import { getServerClient } from './supabase';

export const ENTERPRISE_LINEAGE = {
  engineVersion: 'v2.1.0-enterprise',
  modelProvider: 'openai',
  model: 'gpt-4o',
  promptConfigVersion: '2026.08.19-v1',
  calculationVersion: 'sde-v3',
} as const;

export type EnterpriseLineage = typeof ENTERPRISE_LINEAGE & { runId: string };

export type AuditContext = {
  tenantId?: string | null;
  actorId?: string | null;
  requestId: string;
  sessionId?: string | null;
};

export function newRunId() {
  return `run_${randomUUID().replace(/-/g, '').slice(0, 9)}`;
}

export function lineageForRun(runId = newRunId()): EnterpriseLineage {
  return { ...ENTERPRISE_LINEAGE, runId };
}

export function evidenceHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
}

export async function persistAuditEvent(args: {
  context: AuditContext;
  runId: string;
  action: string;
  previousState?: string | null;
  newState?: string | null;
  parameters?: unknown;
  evidenceHashes?: Record<string, string>;
  modelLineage?: EnterpriseLineage;
  artifactType?: string | null;
  artifactId?: string | null;
  resultStatus: 'success' | 'failure' | 'pending';
}) {
  const db = getServerClient();
  const { error } = await db.from('audit_events').insert({
    event_id: randomUUID(),
    tenant_id: args.context.tenantId ?? null,
    actor_id: args.context.actorId ?? null,
    request_id: args.context.requestId,
    session_id: args.context.sessionId ?? null,
    run_id: args.runId,
    action: args.action,
    previous_state: args.previousState ?? null,
    new_state: args.newState ?? null,
    parameters: args.parameters ?? {},
    model_lineage: args.modelLineage ?? lineageForRun(args.runId),
    evidence_hashes: args.evidenceHashes ?? {},
    artifact_type: args.artifactType ?? null,
    artifact_id: args.artifactId ?? null,
    result_status: args.resultStatus,
  });
  if (error) throw error;
}

export async function persistEnterpriseScan(args: {
  context: AuditContext;
  runId: string;
  input: unknown;
  output: unknown;
}) {
  const db = getServerClient();
  const lineage = lineageForRun(args.runId);
  const hashes = {
    input: evidenceHash(args.input),
    output: evidenceHash(args.output),
  };

  const { data, error } = await db.from('enterprise_scans').insert({
    run_id: args.runId,
    tenant_id: args.context.tenantId ?? null,
    actor_id: args.context.actorId ?? null,
    request_id: args.context.requestId,
    input_payload: args.input,
    output_payload: args.output,
    model_lineage: lineage,
    evidence_hashes: hashes,
    state: 'completed',
  }).select('id,run_id,created_at').single();

  if (error) throw error;

  await persistAuditEvent({
    context: args.context,
    runId: args.runId,
    action: 'enterprise.scan.completed',
    previousState: 'requested',
    newState: 'completed',
    parameters: args.input,
    evidenceHashes: hashes,
    modelLineage: lineage,
    artifactType: 'enterprise_scan',
    artifactId: data.id,
    resultStatus: 'success',
  });

  return data;
}

export async function savePreCallBrief(args: {
  context: AuditContext;
  briefId?: string | null;
  content: unknown;
  previousState?: string | null;
  newState?: string | null;
}) {
  const db = getServerClient();
  const runId = newRunId();
  const lineage = lineageForRun(runId);
  const hashes = { content: evidenceHash(args.content) };
  const record = {
    tenant_id: args.context.tenantId ?? null,
    actor_id: args.context.actorId ?? null,
    request_id: args.context.requestId,
    content: args.content,
    model_lineage: lineage,
    evidence_hashes: hashes,
    state: args.newState ?? 'draft',
    updated_at: new Date().toISOString(),
  };

  const query = args.briefId
    ? db.from('pre_call_briefs').update(record).eq('id', args.briefId)
    : db.from('pre_call_briefs').insert(record);

  const { data, error } = await query.select('id,created_at,updated_at,state,content,model_lineage,evidence_hashes').single();
  if (error) throw error;

  await persistAuditEvent({
    context: args.context,
    runId,
    action: args.briefId ? 'precall.brief.updated' : 'precall.brief.created',
    previousState: args.previousState ?? null,
    newState: args.newState ?? 'draft',
    parameters: args.content,
    evidenceHashes: hashes,
    modelLineage: lineage,
    artifactType: 'pre_call_brief',
    artifactId: data.id,
    resultStatus: 'success',
  });

  return data;
}

export async function loadLatestPreCallBrief(context: AuditContext) {
  const db = getServerClient();
  let query = db.from('pre_call_briefs')
    .select('id,content,state,model_lineage,evidence_hashes,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (context.actorId) query = query.eq('actor_id', context.actorId);
  else if (context.tenantId) query = query.eq('tenant_id', context.tenantId);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}
