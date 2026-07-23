import { Injectable, computed, signal } from '@angular/core';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../content/supabase.client';
import { USE_SUPABASE } from '../content/supabase.config';

/** Result shape shared by the password flows so the login screen can react uniformly. */
export interface AuthResult {
  error: AuthError | null;
  /** True after sign-up when Supabase requires email confirmation (no session yet). */
  needsConfirmation?: boolean;
}

/**
 * Supabase Auth wrapper (ADR-0002). Owns the session as signals kept live via
 * onAuthStateChange, and exposes the sign-in flows. Uses the shared client so the
 * JWT it establishes is the same one the ContentStore adapter sends — that's what
 * makes RLS scope data to this owner. Inert (no user) when USE_SUPABASE is off.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = USE_SUPABASE ? getSupabaseClient() : null;

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  private resolveReady!: () => void;
  private readonly readyPromise = new Promise<void>((res) => (this.resolveReady = res));

  constructor() {
    if (!this.supabase) {
      this.resolveReady();
      return;
    }
    this.supabase.auth.getSession().then(({ data }) => {
      this._user.set(data.session?.user ?? null);
      this.resolveReady();
    });
    this.supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      this._user.set(session?.user ?? null);
      this.resolveReady(); // no-op once already resolved
    });
  }

  /** Resolves once the initial session has been restored (used by the guard). */
  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResult> {
    if (!this.supabase) return { error: null };
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!this.supabase) return { error: null };
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    return { error, needsConfirmation: !error && data.session === null };
  }

  async signInWithGoogle(): Promise<AuthResult> {
    if (!this.supabase) return { error: null };
    // Return to the app's own base URL (respects the /agni/ base-href on Pages).
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: document.baseURI },
    });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.supabase?.auth.signOut();
  }
}
