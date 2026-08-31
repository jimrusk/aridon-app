import crypto from 'crypto';
import { getServerClient } from './supabase';

export const ARIDON_PUBLIC_ORIGIN = 'https://aridon-v02.vercel.app';

export type FinanceProvider = 'plaid' | 'quickbooks' | 'stripe-connect' | 'payroll' | 'invoicing' | 'csv';

export const financeProviderCatalog: Array<{
  key: FinanceProvider;
  label: string;
  category: string;
  capabilities: string[];
  connectionMode: 'oauth' | 'plaid-link' | 'manual';
}> = [
  { key: 'plaid', label: 'Bank & Card Feeds', category: 'banking', capabilities: ['accounts', 'balances', 'transactions', 'incremental sync'], connectionMode: 'plaid-link' },
  { key: 'quickbooks', label: 'QuickBooks Online', category: 'accounting', capabilities: ['chart of accounts', 'purchases', 'deposits', 'invoices', 'payments'], connectionMode: 'oauth' },
  { key: 'stripe-connect', label: 'Stripe Payments', category: 'payments', capabilities: ['charges', 'fees', 'refunds', 'payout economics'], connectionMode: 'oauth' },
  { key: 'payroll', label: 'Payroll', category: 'payroll', capabilities: ['payroll journals', 'tax withholdings', 'benefits', 'contractor payments'], connectionMode: 'manual' },
  { key: 'invoicing', label: 'Invoices & Receivables', category: 'receivables', capabilities: ['invoices', 'due dates', 'customer balances', 'payment matching'], connectionMode: 'manual' },
  { key: 'csv', label: 'Bank / Accounting CSV', category: 'import', capabilities: ['historical import', 'transaction normalization', 'reconciliation'], connectionMode: 'manual' },
];

function requiredServerKey() {
  const source = process.env.FINANCE_CONNECTOR_ENCRYPTION_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!source) throw new Error('Finance connector encryption is not configured.');
  return crypto.createHash('sha256').update(`${source}|aridon-finance-connectors-v1`).digest();
}

export function sealFinanceSecret(value: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', requiredServerKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

export function openFinanceSecret<T = Record<string, unknown>>(sealed: string): T {
  const [ivText, tagText, encryptedText] = sealed.split('.');
  if (!ivText || !tagText || !encryptedText) throw new Error('Stored finance credential is invalid.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', requiredServerKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64url')), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}

export async function saveFinanceSecret(tenantId: string, provider: FinanceProvider, value: unknown) {
  const db = getServerClient();
  const payload = {
    tenant_id: tenantId,
    provider,
    ciphertext: sealFinanceSecret(value),
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from('customer_finance_secrets').upsert(payload, { onConflict: 'tenant_id,provider' });
  if (error) throw error;
}

export async function readFinanceSecret<T = Record<string, unknown>>(tenantId: string, provider: FinanceProvider): Promise<T | null> {
  const db = getServerClient();
  const { data, error } = await db
    .from('customer_finance_secrets')
    .select('ciphertext')
    .eq('tenant_id', tenantId)
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw error;
  if (!data?.ciphertext) return null;
  return openFinanceSecret<T>(data.ciphertext);
}

export async function deleteFinanceSecret(tenantId: string, provider: FinanceProvider) {
  const db = getServerClient();
  const { error } = await db.from('customer_finance_secrets').delete().eq('tenant_id', tenantId).eq('provider', provider);
  if (error) throw error;
}

export function providerConfigured(provider: FinanceProvider) {
  if (provider === 'plaid') return Boolean(process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim());
  if (provider === 'quickbooks') return Boolean(process.env.INTUIT_CLIENT_ID?.trim() && process.env.INTUIT_CLIENT_SECRET?.trim());
  if (provider === 'stripe-connect') return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_CONNECT_CLIENT_ID?.trim());
  return true;
}

export function plaidBaseUrl() {
  const env = (process.env.PLAID_ENV || 'sandbox').trim().toLowerCase();
  if (env === 'production') return 'https://production.plaid.com';
  if (env === 'development') return 'https://development.plaid.com';
  return 'https://sandbox.plaid.com';
}

export function quickBooksRedirectUri() {
  return process.env.INTUIT_REDIRECT_URI?.trim() || `${ARIDON_PUBLIC_ORIGIN}/api/customer/finance/connect/quickbooks/callback`;
}

export function stripeConnectRedirectUri() {
  return process.env.STRIPE_CONNECT_REDIRECT_URI?.trim() || `${ARIDON_PUBLIC_ORIGIN}/api/customer/finance/connect/stripe/callback`;
}

export function sealOAuthState(value: Record<string, unknown>) {
  return sealFinanceSecret({ ...value, issuedAt: Date.now(), nonce: crypto.randomBytes(18).toString('base64url') });
}

export function openOAuthState<T extends { issuedAt?: number }>(value: string): T {
  const parsed = openFinanceSecret<T>(value);
  const age = Date.now() - Number(parsed.issuedAt || 0);
  if (!parsed.issuedAt || age < 0 || age > 20 * 60 * 1000) throw new Error('Finance connection authorization expired.');
  return parsed;
}

export function stableHash(parts: Array<string | number | null | undefined>) {
  return crypto.createHash('sha256').update(parts.map((part) => String(part ?? '')).join('|')).digest('hex').slice(0, 40);
}

export function cleanFinanceText(value: unknown, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function financeNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}
