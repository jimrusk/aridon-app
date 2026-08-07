import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

function encryptionKey() {
  const secret = process.env.CUSTOMER_INTEGRATION_ENCRYPTION_KEY?.trim();
  if (!secret) throw new Error('CUSTOMER_INTEGRATION_ENCRYPTION_KEY is not configured.');
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptCustomerSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

export function decryptCustomerSecret(value: string) {
  const [ivPart, tagPart, cipherPart] = value.split('.');
  if (!ivPart || !tagPart || !cipherPart) throw new Error('Stored integration credential is invalid.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(cipherPart, 'base64url')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

export async function saveCustomerIntegration(
  db: SupabaseClient,
  tenantId: string,
  userId: string,
  provider: 'instantly',
  secret: string,
  metadata: Record<string, unknown> = {},
) {
  const payload = {
    tenant_id: tenantId,
    provider,
    encrypted_secret: encryptCustomerSecret(secret),
    connected_by: userId,
    status: 'connected',
    metadata,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db
    .from('customer_sales_integrations')
    .upsert(payload, { onConflict: 'tenant_id,provider' })
    .select('provider,status,metadata,updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function getCustomerIntegrationSecret(
  db: SupabaseClient,
  tenantId: string,
  provider: 'instantly',
) {
  const { data, error } = await db
    .from('customer_sales_integrations')
    .select('encrypted_secret,status,metadata,updated_at')
    .eq('tenant_id', tenantId)
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw error;
  if (!data?.encrypted_secret || data.status !== 'connected') return null;
  return {
    secret: decryptCustomerSecret(data.encrypted_secret),
    metadata: data.metadata || {},
    updatedAt: data.updated_at || null,
  };
}

export async function disconnectCustomerIntegration(
  db: SupabaseClient,
  tenantId: string,
  provider: 'instantly',
) {
  const { error } = await db
    .from('customer_sales_integrations')
    .update({ status: 'disconnected', encrypted_secret: null, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('provider', provider);
  if (error) throw error;
}
