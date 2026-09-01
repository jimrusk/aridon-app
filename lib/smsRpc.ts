import 'server-only';
import { getServerClient } from './supabase';

export async function smsRpc<T = any>(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await getServerClient().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function smsOwnerTokenFromCookie(cookieValue: string | undefined) {
  const token = cookieValue?.trim();
  return token && token.length >= 32 ? token : null;
}
