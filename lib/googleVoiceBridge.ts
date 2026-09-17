import 'server-only';

import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PhoneBridgeState = 'pairing' | 'online' | 'offline' | 'revoked';
export type PhoneJobState = 'queued' | 'claimed' | 'dialing' | 'ringing' | 'connected' | 'completed' | 'failed' | 'cancelled';

export type PhoneBridgeRecord = {
  id: string;
  tenant_id: string;
  name: string;
  status: PhoneBridgeState;
  pairing_code_hash: string | null;
  pairing_expires_at: string | null;
  auth_token_hash: string | null;
  last_seen_at: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PhoneJobRecord = {
  id: string;
  tenant_id: string;
  bridge_id: string | null;
  target_id: string | null;
  direction: 'outbound' | 'inbound';
  phone: string;
  contact_name: string | null;
  company_name: string | null;
  objective: string;
  state: PhoneJobState;
  error: string | null;
  transcript: string | null;
  summary: string | null;
  claimed_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function phoneBridgeHash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function phoneBridgePairingCode() {
  return String(randomInt(100000, 1000000));
}

export function phoneBridgeToken() {
  return randomBytes(32).toString('base64url');
}

export function safeHashEqual(left: string, right: string) {
  try {
    const a = Buffer.from(left, 'hex');
    const b = Buffer.from(right, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function bridgeIsOnline(bridge: Pick<PhoneBridgeRecord, 'status' | 'last_seen_at'> | null | undefined) {
  if (!bridge || bridge.status !== 'online' || !bridge.last_seen_at) return false;
  const seen = Date.parse(bridge.last_seen_at);
  return Number.isFinite(seen) && Date.now() - seen <= ONLINE_WINDOW_MS;
}

export async function phoneBridgeConnectionStatus(tenantId: string, db: SupabaseClient) {
  const result = await db
    .from('customer_phone_bridges')
    .select('id,name,status,last_seen_at,metadata,auth_token_hash,created_at')
    .eq('tenant_id', tenantId)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    const missingTable = String(result.error.message || '').toLowerCase().includes('customer_phone_bridges');
    if (missingTable) return { configured: false, online: false, status: 'not_installed', bridgeId: null, fromNumber: '', lastSeenAt: null };
    throw result.error;
  }

  const bridge = (result.data || null) as (Partial<PhoneBridgeRecord> & { auth_token_hash?: string | null }) | null;
  if (!bridge) return { configured: false, online: false, status: 'unpaired', bridgeId: null, fromNumber: '', lastSeenAt: null };

  const metadata = (bridge.metadata || {}) as Record<string, unknown>;
  const fromNumber = typeof metadata.googleVoiceNumber === 'string' ? metadata.googleVoiceNumber : '';
  return {
    configured: Boolean(bridge.auth_token_hash),
    online: bridgeIsOnline(bridge as PhoneBridgeRecord),
    status: bridge.status || 'offline',
    bridgeId: bridge.id || null,
    fromNumber,
    lastSeenAt: bridge.last_seen_at || null,
    name: bridge.name || 'Eva Phone Bridge',
  };
}

export async function getOnlinePhoneBridge(tenantId: string, db: SupabaseClient) {
  const result = await db
    .from('customer_phone_bridges')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'online')
    .not('auth_token_hash', 'is', null)
    .order('last_seen_at', { ascending: false })
    .limit(5);
  if (result.error) {
    if (String(result.error.message || '').toLowerCase().includes('customer_phone_bridges')) return null;
    throw result.error;
  }
  const bridges = (result.data || []) as PhoneBridgeRecord[];
  return bridges.find(bridgeIsOnline) || null;
}

export async function authenticatePhoneBridgeToken(token: string, db: SupabaseClient) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const result = await db
    .from('customer_phone_bridges')
    .select('*')
    .eq('auth_token_hash', phoneBridgeHash(trimmed))
    .neq('status', 'revoked')
    .maybeSingle();
  if (result.error) throw result.error;
  return (result.data || null) as PhoneBridgeRecord | null;
}

export function bearerToken(authorization: string | null) {
  if (!authorization) return '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

export async function queuePhoneBridgeJob(input: {
  tenantId: string;
  bridgeId: string;
  targetId?: string | null;
  phone: string;
  contactName?: string | null;
  companyName?: string | null;
  objective: string;
  createdBy?: string | null;
}, db: SupabaseClient) {
  const result = await db.from('customer_phone_jobs').insert({
    tenant_id: input.tenantId,
    bridge_id: input.bridgeId,
    target_id: input.targetId || null,
    direction: 'outbound',
    phone: input.phone,
    contact_name: input.contactName || null,
    company_name: input.companyName || null,
    objective: input.objective,
    state: 'queued',
    created_by: input.createdBy || null,
  }).select('*').single();
  if (result.error) throw result.error;
  return result.data as PhoneJobRecord;
}
