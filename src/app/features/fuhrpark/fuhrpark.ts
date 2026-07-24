import { Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/library/library.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { Vehicle } from '../../core/models/vehicle';

/** A vehicle plus the derived loadout summary shown in the roster. */
interface Row {
  vehicle: Vehicle;
  typeName: string;
  filled: number;
  total: number;
  pct: number;
  /** The type has no compartment layout yet (ADR-0003) — not loadable/playable. */
  locked: boolean;
}

/**
 * Fuhrpark — the vehicle roster (Gerätehaus, screen-flow §7.2, ported from
 * docs/design/screens/06-fuhrpark.html). List the Author's vehicles, create a
 * new one from a type (clones the DIN loadout, ADR-0001), rename, remove, and
 * jump into Beladung. Layout per type is fixed; only the loadout is editable.
 */
@Component({
  selector: 'fk-fuhrpark',
  imports: [RouterLink, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './fuhrpark.html',
  styleUrl: './fuhrpark.scss',
})
export class Fuhrpark {
  readonly auth = inject(AuthService);
  readonly library = inject(LibraryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly showAccount = USE_SUPABASE;

  /** Local light/dark theme for the screen — defaults to the OS preference. */
  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  readonly types = computed(() => this.library.vehicleTypes());

  readonly rows = computed<Row[]>(() =>
    this.library.vehicles().map((vehicle) => {
      const compartments = this.library.compartmentsForVehicle(vehicle.id);
      const placed = new Set(
        this.library.placementsForVehicle(vehicle.id).map((p) => p.compartmentId),
      );
      const total = compartments.length;
      const filled = compartments.filter((c) => placed.has(c.id)).length;
      return {
        vehicle,
        typeName: this.library.typeById(vehicle.typeId)?.name ?? vehicle.typeId,
        filled,
        total,
        pct: total ? Math.round((filled / total) * 100) : 0,
        locked: total === 0,
      };
    }),
  );

  // ---- create form -------------------------------------------------------
  readonly creating = signal(false);
  readonly newName = signal('');
  readonly newTypeId = signal('');

  // ---- per-row menu + inline rename --------------------------------------
  readonly menuOpen = signal<string | null>(null);
  readonly editing = signal<string | null>(null);
  readonly editName = signal('');
  readonly busy = signal(false);

  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  constructor() {
    void this.library.ensureLoaded();

    // Deep-linked from the Gerätehaus "+ Fahrzeug" action — open the create form.
    if (this.route.snapshot.queryParamMap.get('new') !== null) {
      this.creating.set(true);
    }

    // Default the type dropdown to the first type once the Library has loaded
    // (types() is empty during the async load, so we can't set it eagerly).
    effect(() => {
      if (this.creating() && !this.newTypeId()) {
        const first = this.types()[0]?.id;
        if (first) this.newTypeId.set(first);
      }
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  // ---- create ------------------------------------------------------------
  startCreate(): void {
    this.newName.set('');
    this.newTypeId.set(this.types()[0]?.id ?? '');
    this.menuOpen.set(null);
    this.editing.set(null);
    this.creating.set(true);
  }

  cancelCreate(): void {
    this.creating.set(false);
  }

  async create(): Promise<void> {
    const name = this.newName().trim();
    const typeId = this.newTypeId();
    if (!name || !typeId || this.busy()) return;
    this.busy.set(true);
    try {
      await this.library.createVehicleFromType(name, typeId);
      this.creating.set(false);
    } finally {
      this.busy.set(false);
    }
  }

  // ---- row menu / rename / delete ----------------------------------------
  toggleMenu(id: string): void {
    this.menuOpen.update((m) => (m === id ? null : id));
  }

  closeMenu(): void {
    this.menuOpen.set(null);
  }

  startRename(v: Vehicle): void {
    this.editing.set(v.id);
    this.editName.set(v.name);
    this.menuOpen.set(null);
  }

  cancelRename(): void {
    this.editing.set(null);
  }

  async saveRename(id: string): Promise<void> {
    const name = this.editName().trim();
    if (name) await this.library.renameVehicle(id, name);
    this.editing.set(null);
  }

  async remove(v: Vehicle): Promise<void> {
    this.menuOpen.set(null);
    if (!confirm(`„${v.name}“ wirklich aus dem Fuhrpark entfernen?`)) return;
    await this.library.deleteVehicle(v.id);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
