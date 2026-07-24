import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/library/library.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';

/** Landing screen — pick a Game Mode. v1 ships In-Person; others are roadmap. */
@Component({
  selector: 'fk-home',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);
  readonly showAccount = USE_SUPABASE;

  /** Local light/dark theme for the screen — defaults to the OS preference. */
  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  /** First vehicle in the Library — the "Dienstfahrzeug" summarised in the prep row. */
  readonly vehicle = computed(() => this.library.vehicles()[0]);
  readonly vehicleType = computed(() => {
    const v = this.vehicle();
    return v ? this.library.typeById(v.typeId) : undefined;
  });
  readonly compartmentCount = computed(() => {
    const v = this.vehicle();
    return v ? this.library.compartmentsForVehicle(v.id).length : 0;
  });
  readonly placedCount = computed(() => {
    const v = this.vehicle();
    return v ? this.library.placedEquipment(v.id).length : 0;
  });

  /** Two-letter avatar mark derived from the signed-in e-mail (e.g. "f.koch@…" → "FK"). */
  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  constructor() {
    void this.library.ensureLoaded();
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
