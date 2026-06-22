import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

let cached: SupabaseClient | null = null;

/**
 * Server-only client using the service role key. Bypasses RLS — use only in
 * Next.js API routes for admin operations and order status updates.
 *
 * Resolved lazily rather than at module load so the build step (which runs
 * without SUPABASE_SERVICE_ROLE_KEY present) can collect route data without
 * throwing. The key must be present at runtime in the deployed environment.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for server operations.');
  }
  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Convenience accessor (lazy). */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return Reflect.get(getSupabaseAdmin() as any, prop);
  },
});
