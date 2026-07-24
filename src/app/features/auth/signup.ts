import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { HlmButton } from '../../shared/ui/hlm-button.directive';

/** Author sign-up: create an account with email + password, or via Google OAuth. */
@Component({
  selector: 'fk-signup',
  imports: [FormsModule, RouterLink, HlmButton],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly info = signal('');
  readonly busy = signal(false);

  async submit(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.info.set('');
    const { error, needsConfirmation } = await this.auth.signUp(email, password);
    this.busy.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    if (needsConfirmation) {
      this.info.set('Bestätigungs-E-Mail gesendet — bitte Postfach prüfen.');
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
