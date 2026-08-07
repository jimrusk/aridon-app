import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// The Supabase project URL is public configuration, not a secret. Keep a known-good
// project URL here so a malformed Vercel public env value cannot take down the app.
const ARIDON_SUPABASE_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co';

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
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function supabaseUrl(): string {
  // Browser-exposed environment variables must be referenced statically so Next.js
  // can inline them. If the configured value is malformed, use the verified public
  // Aridon Supabase project URL instead of allowing createClient() to crash hydration.
  return validHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || ARIDON_SUPABASE_URL;
}

export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const anonKey = requiredValue(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    browserClient = createClient(supabaseUrl(), anonKey);
  }
  return browserClient;
}

// Service-role access stays server-only and is initialized lazily.
export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const serviceRoleKey = requiredValue(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    serverClient = createClient(supabaseUrl(), serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}
