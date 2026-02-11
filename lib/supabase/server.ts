import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase client singleton (used from server only: loader, Server Components).
 * Returns null if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance !== null) {
    return supabaseInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const perishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !perishableKey) {
    return null;
  }

  supabaseInstance = createClient(url, perishableKey);
  return supabaseInstance;
}
