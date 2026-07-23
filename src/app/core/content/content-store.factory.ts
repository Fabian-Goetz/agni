import { ContentStore } from './content-store.port';
import { LocalStorageContentStore } from './local-storage.content-store';
import { SupabaseContentStore } from './supabase.content-store';
import { getSupabaseClient } from './supabase.client';
import { SUPABASE_ANON_KEY, SUPABASE_URL, USE_SUPABASE } from './supabase.config';

/**
 * Selects the active ContentStore adapter (ADR-0002). Local by default; flip
 * USE_SUPABASE in supabase.config.ts to persist to Postgres. The Supabase adapter
 * shares the one auth-aware client (supabase.client.ts). The rest of the app is
 * unaware of which adapter is live.
 */
export function createContentStore(): ContentStore {
  if (USE_SUPABASE && SUPABASE_URL && SUPABASE_ANON_KEY) {
    return new SupabaseContentStore(getSupabaseClient());
  }
  return new LocalStorageContentStore(localStorage);
}
