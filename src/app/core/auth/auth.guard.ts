import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { USE_SUPABASE } from '../content/supabase.config';

/**
 * Gates content routes when Supabase is active: an Author must be signed in to
 * reach their Library. No-op in local mode (no accounts), so nothing regresses
 * when USE_SUPABASE is off. Awaits the initial session restore so a deep link or
 * refresh doesn't bounce an already-signed-in user to /login.
 */
export const authGuard: CanActivateFn = async () => {
  if (!USE_SUPABASE) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  return auth.isAuthenticated() ? true : router.parseUrl('/login');
};
