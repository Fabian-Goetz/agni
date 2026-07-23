/**
 * Supabase wiring (ADR-0002). With USE_SUPABASE on, Libraries persist to Postgres
 * (per-owner via RLS) and Authors sign in; with it off the app runs fully
 * offline/local against localStorage with no accounts.
 *
 * The publishable/anon key is safe to ship — Row-Level Security
 * (docs/supabase/schema.sql) is what actually protects data.
 */
export const USE_SUPABASE = true;

export const SUPABASE_URL = 'https://wbrelbhcrmeodwrsabid.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_C1cUP4e5imD6_SOWBvemcg_A5jU-_Rw';
