import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { HlmButton } from '../../shared/ui/hlm-button.directive';

/** Landing screen — pick a Game Mode. v1 ships In-Person; others are roadmap. */
@Component({
  selector: 'fk-home',
  imports: [RouterLink, HlmButton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly showAccount = USE_SUPABASE;

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
