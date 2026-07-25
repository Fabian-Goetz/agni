import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/library/library.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { GAMES } from '../../core/session/round-config';

/**
 * Game-mode launcher — pick a game within the (In-Person) Game mode.
 * Sits between Home (pick a mode) and Vorbereiten (/select). v1 ships two
 * Schematic-engine games; the rest are roadmap. Ported from
 * docs/design/screens/04-spiele-uebersicht.html. See docs/design/game-catalog.md.
 *
 * Laid out like the Gerätehaus hub (design-guidelines §7a): the launchable games
 * are the primary panel, the roadmap is demoted to a quiet reference strip so
 * visual weight descends with actual usefulness.
 */
@Component({
  selector: 'fk-games',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './games.html',
  styleUrl: './games.scss',
})
export class Games {
  readonly auth = inject(AuthService);
  private readonly library = inject(LibraryService);
  readonly showAccount = USE_SUPABASE;

  /** How many games are actually launchable — the section label and footer count. */
  readonly availableCount = Object.keys(GAMES).length;

  /** Local light/dark theme for the screen — defaults to the OS preference. */
  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  /** Fahrzeugtyp of the first Library vehicle — shown in the footer, mirroring Home. */
  readonly vehicleType = computed(() => {
    const v = this.library.vehicles()[0];
    return v ? this.library.typeById(v.typeId) : undefined;
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
}
