/**
 * Supabase wiring (ADR-0002). Flip USE_SUPABASE to true and fill in the project
 * URL + anon key to persist Libraries to Postgres instead of localStorage. The
 * anon key is safe to ship — Row-Level Security (docs/supabase/schema.sql) is
 * what actually protects data.
 *
 * Left off by default so v1 runs fully offline/local with no project required.
 */
export const USE_SUPABASE = false;

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
