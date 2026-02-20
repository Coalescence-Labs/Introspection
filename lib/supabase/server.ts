import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase client singleton (used from server only: loader, Server Components).
 * Returns null if URL and key are not set.
 *
 * Prefer runtime env vars (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) so production
 * builds work when env is set at deploy/runtime. NEXT_PUBLIC_* are inlined at
 * build time, so they are only available in the built app if they were set
 * during `next build`.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance !== null) {
    return supabaseInstance;
  }

  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const perishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !perishableKey) {
    return null;
  }

  supabaseInstance = createClient(url, perishableKey);
  return supabaseInstance;
}
