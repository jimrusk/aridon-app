import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// These are intentionally public client configuration values. Supabase project URLs
// and publishable keys are designed to ship in browser bundles. Pinning the verified
// Aridon project values here prevents a malformed Vercel NEXT_PUBLIC_* value from
// taking down hydration, login, and every server route that shares the project URL.
const SUPABASE_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qypop4kssE-5lAhUDAO_yQ_wNHXuOdS';

function requiredValue(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return browserClient;
}

export function getUserScopedClient(accessToken: string): SupabaseClient {
  const token = accessToken.trim();
  if (!token) throw new Error('A user access token is required.');

  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// Service-role access stays server-only and is initialized lazily. The secret key
// remains in Vercel and is never embedded in the browser bundle or repository.
export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const serviceRoleKey = requiredValue('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

    serverClient = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}
