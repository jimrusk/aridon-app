import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getServerClient } from './supabase';

export type SignalWireCredentials = {
  space: string;
  projectId: string;
  apiToken: string;
  fromNumber: string;
};

type StoredMetadata = {
  space?: string;
  projectId?: string;
  fromNumber?: string;
};

function clean(value: unknown, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function normalizeSignalWireSpace(value: unknown) {
  return clean(value, 160)
    .replace(/^https?:\/\//i, '')
    .replace(/\.signalwire\.com\/?$/i, '')
    .replace(/\/$/, '');
}

export function normalizePhoneNumber(value: unknown) {
  const raw = clean(value, 40);
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return raw;
}

function keyMaterial() {
  const root =
    process.env.CUSTOMER_INTEGRATION_ENCRYPTION_KEY?.trim() ||
    process.env.PHONE_CALL_SIGNING_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!root) throw new Error('Secure integration encryption is not available on this server.');
  return createHash('sha256').update(`aridon:signalwire:v1:${root}`, 'utf8').digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decrypt(value: string) {
  const [version, ivText, tagText, encryptedText] = value.split('.');
  if (version !== 'v1' || !ivText || !tagText || !encryptedText) throw new Error('Stored SignalWire credentials are unreadable.');
  const decipher = createDecipheriv('aes-256-gcm', keyMaterial(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function envCredentials(): SignalWireCredentials | null {
  const space = normalizeSignalWireSpace(process.env.SIGNALWIRE_SPACE);
  const projectId = clean(process.env.SIGNALWIRE_PROJECT_ID, 200);
  const apiToken = clean(process.env.SIGNALWIRE_API_TOKEN, 600);
  const fromNumber = normalizePhoneNumber(process.env.SIGNALWIRE_FROM_NUMBER);
  if (!space || !projectId || !apiToken || !fromNumber) return null;
  return { space, projectId, apiToken, fromNumber };
}

async function storedRow(tenantId: string) {
  const db = getServerClient();
  const result = await db
    .from('customer_direct_integrations')
    .select('id,encrypted_secret,status,metadata,last_verified_at')
    .eq('tenant_id', tenantId)
    .eq('provider', 'signalwire')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data as null | {
    id: string;
    encrypted_secret: string | null;
    status: string | null;
    metadata: StoredMetadata | null;
    last_verified_at: string | null;
  };
}

export async function loadSignalWireCredentials(tenantId: string): Promise<SignalWireCredentials | null> {
  const row = await storedRow(tenantId);
  if (row?.status !== 'disconnected' && row?.encrypted_secret) {
    try {
      const parsed = JSON.parse(decrypt(row.encrypted_secret)) as SignalWireCredentials;
      const space = normalizeSignalWireSpace(parsed.space);
      const projectId = clean(parsed.projectId, 200);
      const apiToken = clean(parsed.apiToken, 600);
      const fromNumber = normalizePhoneNumber(parsed.fromNumber);
      if (space && projectId && apiToken && fromNumber) return { space, projectId, apiToken, fromNumber };
    } catch (error) {
      console.error('Unable to decrypt stored SignalWire credentials', error);
    }
  }
  return envCredentials();
}

export async function signalWireConnectionStatus(tenantId: string) {
  const row = await storedRow(tenantId);
  let stored: SignalWireCredentials | null = null;
  if (row?.status !== 'disconnected' && row?.encrypted_secret) {
    try {
      stored = JSON.parse(decrypt(row.encrypted_secret)) as SignalWireCredentials;
    } catch {
      stored = null;
    }
  }
  const env = envCredentials();
  const active = stored || env;
  const metadata = row?.metadata || {};
  return {
    configured: Boolean(active?.space && active?.projectId && active?.apiToken && active?.fromNumber),
    source: stored ? 'saved' as const : env ? 'environment' as const : null,
    space: Boolean(active?.space),
    projectId: Boolean(active?.projectId),
    apiToken: Boolean(active?.apiToken),
    fromNumber: Boolean(active?.fromNumber),
    values: {
      space: stored ? normalizeSignalWireSpace(stored.space) : normalizeSignalWireSpace(metadata.space || env?.space || ''),
      projectId: stored ? clean(stored.projectId, 200) : clean(metadata.projectId || env?.projectId || '', 200),
      fromNumber: stored ? normalizePhoneNumber(stored.fromNumber) : normalizePhoneNumber(metadata.fromNumber || env?.fromNumber || ''),
    },
    apiTokenSaved: Boolean(stored?.apiToken || env?.apiToken),
    lastVerifiedAt: row?.last_verified_at || null,
  };
}

export async function saveSignalWireCredentials(args: {
  tenantId: string;
  userId: string;
  space: unknown;
  projectId: unknown;
  apiToken: unknown;
  fromNumber: unknown;
}) {
  const existing = await loadSignalWireCredentials(args.tenantId);
  const space = normalizeSignalWireSpace(args.space);
  const projectId = clean(args.projectId, 200);
  const apiToken = clean(args.apiToken, 600) || existing?.apiToken || '';
  const fromNumber = normalizePhoneNumber(args.fromNumber);

  if (!space) throw new Error('SignalWire Space name is required.');
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(space)) throw new Error('SignalWire Space should be the name before .signalwire.com.');
  if (!projectId) throw new Error('SignalWire Project ID is required.');
  if (!apiToken) throw new Error('SignalWire API token is required the first time you connect.');
  if (!/^\+[1-9]\d{7,14}$/.test(fromNumber)) throw new Error('SignalWire From number must be a valid phone number, for example +16025294059.');

  const credentials: SignalWireCredentials = { space, projectId, apiToken, fromNumber };
  const encryptedSecret = encrypt(JSON.stringify(credentials));
  const db = getServerClient();
  const current = await storedRow(args.tenantId);
  const values = {
    label: 'Eva voice calling',
    encrypted_secret: encryptedSecret,
    status: 'connected',
    metadata: { space, projectId, fromNumber },
    updated_at: new Date().toISOString(),
  };

  if (current?.id) {
    const result = await db.from('customer_direct_integrations').update(values).eq('id', current.id).eq('tenant_id', args.tenantId).select('id').single();
    if (result.error) throw result.error;
  } else {
    const result = await db.from('customer_direct_integrations').insert({
      tenant_id: args.tenantId,
      created_by: args.userId,
      provider: 'signalwire',
      ...values,
    }).select('id').single();
    if (result.error) throw result.error;
  }
  return signalWireConnectionStatus(args.tenantId);
}

export async function disconnectSignalWire(tenantId: string) {
  const row = await storedRow(tenantId);
  if (!row?.id) return;
  const db = getServerClient();
  const result = await db.from('customer_direct_integrations').update({
    status: 'disconnected',
    encrypted_secret: null,
    metadata: {},
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).eq('tenant_id', tenantId);
  if (result.error) throw result.error;
}

export async function markSignalWireVerified(tenantId: string) {
  const row = await storedRow(tenantId);
  if (!row?.id || row.status === 'disconnected') return;
  const db = getServerClient();
  const now = new Date().toISOString();
  const result = await db.from('customer_direct_integrations').update({ last_verified_at: now, updated_at: now }).eq('id', row.id).eq('tenant_id', tenantId);
  if (result.error) console.error('Could not mark SignalWire verified', result.error);
}
