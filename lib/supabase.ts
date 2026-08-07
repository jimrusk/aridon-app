import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// These are public client coordinates for the active Aridon Supabase project.
// Supabase publishable keys are intentionally safe to ship in browser bundles.
// Server/service-role credentials remain environment-only and are never hardcoded.
const ARIDON_SUPABASE_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co';
const ARIDON_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qypop4kssE-5lAhUDAO_yQ_wNHXuOdS';

function requiredValue(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function validHttpUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

function publicSupabaseUrl() {
  return validHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || ARIDON_SUPABASE_URL;
}

function publicSupabaseKey() {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return configured || ARIDON_SUPABASE_PUBLISHABLE_KEY;
}

export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(publicSupabaseUrl(), publicSupabaseKey());
  }
  return browserClient;
}

// Service-role access stays server-only and is initialized lazily. A malformed
// public URL can no longer break server routes, while the secret key still must
// come from Vercel and is never exposed to client code.
export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const serviceRoleKey = requiredValue('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

    serverClient = createClient(publicSupabaseUrl(), serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}
