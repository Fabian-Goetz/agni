import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase.config';

/**
 * Single shared Supabase client (ADR-0002). Auth and the ContentStore adapter
 * MUST use the same instance so the signed-in JWT flows into every `.from()`
 * query — that JWT is what RLS scopes each read/write to the owner. Created
 * lazily so nothing touches Supabase when USE_SUPABASE is off (empty config).
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes the Google OAuth redirect on load
      },
    });
  }
  return client;
}
