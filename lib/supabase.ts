import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

function requiredValue(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

// Browser-exposed environment variables must be referenced statically so Next.js
// can inline them into the client bundle. Dynamic process.env[name] access is not
// replaced in browser code and can cause a client-side exception after hydration.
export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const url = requiredValue('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anonKey = requiredValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

// Service-role access stays server-only and is initialized lazily.
export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const url = requiredValue('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceRoleKey = requiredValue('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

    serverClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}
