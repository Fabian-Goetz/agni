import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/** Author sign-in: email + password, or Google OAuth. Sign-up lives at /signup. */
@Component({
  selector: 'fk-login',
  imports: [FormsModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  /** Local light/dark theme for the auth screen — defaults to the OS preference. */
  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  async submit(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const { error } = await this.auth.signInWithPassword(email, password);
    this.busy.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  async google(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    const { error } = await this.auth.signInWithGoogle();
    if (error) {
      this.error.set(error.message);
      this.busy.set(false);
    }
    // On success the browser redirects to Google, so no navigation here.
  }
}
