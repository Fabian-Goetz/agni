import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { HlmButton } from '../../shared/ui/hlm-button.directive';

/** Author sign-up: create an account with email + password, or via Google OAuth. */
@Component({
  selector: 'fk-signup',
  imports: [FormsModule, RouterLink, HlmButton],
  template: `
    <main class="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <header class="text-center">
        <h1 class="text-3xl font-black tracking-tight text-primary">Agni</h1>
        <p class="mt-2 text-sm text-muted-foreground">Konto erstellen.</p>
      </header>

      <form class="flex flex-col gap-3" (ngSubmit)="submit()">
        <input
          type="email"
          name="email"
          autocomplete="email"
          placeholder="E-Mail"
          class="rounded-md border border-border bg-input px-3 py-2.5 text-sm"
          [(ngModel)]="email"
          required
        />
        <input
          type="password"
          name="password"
          autocomplete="new-password"
          placeholder="Passwort"
          class="rounded-md border border-border bg-input px-3 py-2.5 text-sm"
          [(ngModel)]="password"
          required
        />

        @if (error()) {
          <p class="text-sm font-medium text-primary">{{ error() }}</p>
        }
        @if (info()) {
          <p class="text-sm font-medium text-go">{{ info() }}</p>
        }

        <button hlmBtn size="xl" type="submit" [disabled]="busy() || !email().trim() || !password()">
          Registrieren
        </button>
      </form>

      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <span class="h-px flex-1 bg-border"></span>oder<span class="h-px flex-1 bg-border"></span>
      </div>

      <button hlmBtn variant="outline" size="xl" [disabled]="busy()" (click)="google()">
        Mit Google registrieren
      </button>

      <a routerLink="/login" class="text-center text-sm text-muted-foreground">
        Schon registriert? <span class="font-semibold text-primary">Anmelden</span>
      </a>
    </main>
  `,
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
