import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Created only when browser code explicitly needs Supabase. Keeping this lazy
// prevents Vercel's build step from crashing while it analyzes server routes.
export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(
      required('NEXT_PUBLIC_SUPABASE_URL'),
      required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    );
  }
  return browserClient;
}

// Service-role access stays server-only and is also initialized lazily.
export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createClient(
      required('NEXT_PUBLIC_SUPABASE_URL'),
      required('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return serverClient;
}
