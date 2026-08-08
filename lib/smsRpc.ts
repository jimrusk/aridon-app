import 'server-only';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qypop4kssE-5lAhUDAO_yQ_wNHXuOdS';

const smsDb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function smsRpc<T = any>(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await smsDb.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function smsOwnerTokenFromCookie(cookieValue: string | undefined) {
  const token = cookieValue?.trim();
  return token && token.length >= 32 ? token : null;
}
