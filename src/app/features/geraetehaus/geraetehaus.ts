import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/library/library.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { Vehicle } from '../../core/models/vehicle';

/** A vehicle plus the derived loadout summary shown in the workspace list. */
interface Row {
  vehicle: Vehicle;
  typeName: string;
  filled: number;
  total: number;
  pct: number;
  /** Type has no compartment layout to draw (ADR-0003) — can't be loaded. */
  locked: boolean;
}

/**
 * Gerätehaus hub — the equipment-management landing (screen-flow §7). Two zones:
 * the workspace ("Deine Fahrzeuge") where the Author loads each vehicle — the
 * primary task, merging the fleet roster with the Beladung entry point — and the
 * Nachschlagen reference strip (Geräte- + Fahrzeug-Katalog) demoted below it.
 */
@Component({
  selector: 'fk-geraetehaus',
  imports: [RouterLink, FormsModule],
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

  readonly types = computed(() => this.library.vehicleTypes());

  /** Types with a renderable layout — a vehicle from these is loadable at once. */
  readonly loadableTypes = computed(() =>
    this.types().filter((t) => this.library.typeHasSchematic(t)),
  );
  /** Catalog master data: creatable, but not loadable until a schematic lands. */
  readonly stubTypes = computed(() =>
    this.types().filter((t) => !this.library.typeHasSchematic(t)),
  );
  /** True while the create form points at a type that can't be loaded yet. */
  readonly newTypeLocked = computed(() => {
    const id = this.newTypeId();
    return !!id && !this.library.typeHasSchematic(this.library.typeById(id));
  });

  /** The Author's vehicles with their loadout summary — the workspace list. */
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
        pct: total ? Math.min(100, Math.round((filled / total) * 100)) : 0,
        locked: !this.library.hasSchematic(vehicle.id),
      };
    }),
  );

  // ---- inline create form ------------------------------------------------
  readonly creating = signal(false);
  readonly newName = signal('');
  readonly newTypeId = signal('');
  readonly busy = signal(false);

  // ---- per-row menu + inline rename --------------------------------------
  readonly menuOpen = signal<string | null>(null);
  readonly editing = signal<string | null>(null);
  readonly editName = signal('');

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
    if (!confirm(`„${v.name}" wirklich aus dem Fuhrpark entfernen?`)) return;
    await this.library.deleteVehicle(v.id);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
