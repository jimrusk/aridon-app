import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// These are intentionally public client credentials for the verified Aridon
// Supabase project. Keeping a verified fallback prevents a malformed Vercel
// NEXT_PUBLIC_* value from taking the whole browser application down again.
const VERIFIED_SUPABASE_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co';
const VERIFIED_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qypop4kssE-5lAhUDAO_yQ_wNHXuOdS';

function requiredValue(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function publicSupabaseUrl() {
  return isHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
    ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
    : VERIFIED_SUPABASE_URL;
}

function publicSupabaseKey() {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return configured || VERIFIED_SUPABASE_PUBLISHABLE_KEY;
}

// Browser-exposed environment variables must be referenced statically so Next.js
// can inline them into the client bundle. The verified fallback is also public and
// ensures auth controls degrade safely even if Vercel configuration is malformed.
export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(publicSupabaseUrl(), publicSupabaseKey());
  }
  return browserClient;
}

// Service-role access stays server-only and is initialized lazily. The project URL
// uses the same verified fallback, while the privileged service-role key must remain
// a server-only environment variable and is never embedded here.
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
