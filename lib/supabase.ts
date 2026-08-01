import { createClient } from '@supabase/supabase-js';

// Server-side client — call inside API route handlers only, never at module level
export function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
