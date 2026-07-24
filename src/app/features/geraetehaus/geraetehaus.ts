import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/library/library.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';

/**
 * Gerätehaus hub — the equipment-management landing (screen-flow §7, ported from
 * docs/design/screens/05-geraetehaus.html). Two source areas (Fuhrpark, Geräte-
 * Katalog) and the Beladung "workbench" that joins them. Fuhrpark management is
 * roadmap for now, so its card is shown locked ("In Planung").
 */
@Component({
  selector: 'fk-geraetehaus',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './geraetehaus.html',
  styleUrl: './geraetehaus.scss',
})
export class Geraetehaus {
  readonly auth = inject(AuthService);
  readonly library = inject(LibraryService);
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

  readonly vehicleCount = computed(() => this.library.vehicles().length);
  readonly vehicleTypeCount = computed(() => this.library.vehicleTypes().length);
  readonly equipmentCount = computed(() => this.library.equipment().length);
  readonly categoryCount = computed(
    () => new Set(this.library.equipment().map((e) => e.category).filter(Boolean)).size,
  );

  /** First vehicle in the Library — summarised on the Beladung workbench card. */
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

  /** Two-letter avatar mark derived from the signed-in e-mail. */
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
