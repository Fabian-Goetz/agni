import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VehicleSchematic } from '../../shared/vehicle-schematic';
import { LibraryService } from '../../core/library/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { CompartmentId } from '../../core/models/compartment';
import { Equipment } from '../../core/models/equipment';

/**
 * Beladung editor — the Author's workbench (Gerätehaus, screen-flow §7.3).
 *
 * Two panes, both live at once: the Geräte-Katalog on the left, the vehicle
 * schematic on the right. Placement editing is **bidirectional** (CONTEXT) and
 * needs no mode switch, because each pane drives a highlight in the other:
 * - tap a **Fach** → its Geräte sort to the top of the list with a green check;
 * - tap a **Gerät** → every Fach that carries it lights up green on the schematic.
 *
 * Writes go through one control only — a row's check button toggles that Gerät in
 * the open Fach. Tapping the schematic never writes, so inspecting where a Gerät
 * lives can't place it by accident.
 */
@Component({
  selector: 'fk-editor',
  imports: [VehicleSchematic, RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  readonly library = inject(LibraryService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly showAccount = USE_SUPABASE;

  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  readonly vehicleId = signal<string | null>(null);
  /** The Fach being worked — set by tapping the schematic. */
  readonly openFach = signal<CompartmentId | null>(null);
  /** The Gerät being traced — set by tapping a list row. */
  readonly activeGeraetId = signal<string | null>(null);
  readonly search = signal('');
  readonly newName = signal('');

  readonly currentVehicle = computed(() => {
    const id = this.vehicleId();
    return id ? this.library.vehicleById(id) : undefined;
  });

  /** The type drives which schematic gets drawn (ADR-0003). */
  readonly vehicleType = computed(() => {
    const v = this.currentVehicle();
    return v ? this.library.typeById(v.typeId) : undefined;
  });

  /**
   * Only vehicles whose type carries a compartment layout can be edited — the
   * Fahrzeugkatalog master-data stubs have none, so there is nothing to draw.
   */
  readonly hasSchematic = computed(() => {
    const id = this.vehicleId();
    return !!id && this.library.hasSchematic(id);
  });

  readonly compartments = computed(() => {
    const id = this.vehicleId();
    return id ? this.library.compartmentsForVehicle(id) : [];
  });

  readonly activeGeraet = computed<Equipment | undefined>(() => {
    const id = this.activeGeraetId();
    return id ? this.library.equipmentById(id) : undefined;
  });

  /** Amber outline: the Fach under the cursor of attention. */
  readonly selectedZones = computed<CompartmentId[]>(() => {
    const fach = this.openFach();
    return fach ? [fach] : [];
  });

  /** Green: everywhere the active Gerät is verlastet on this vehicle. */
  readonly markedZones = computed<CompartmentId[]>(() => {
    const id = this.activeGeraetId();
    return id ? this.zonesFor(id) : [];
  });

  /**
   * The left pane. Search-filtered, and — once a Fach is open — that Fach's own
   * Geräte float to the top so its Beladung reads as a block.
   */
  readonly listed = computed<Equipment[]>(() => {
    const q = this.search().trim().toLowerCase();
    const all = q
      ? this.library
          .equipmentSorted()
          .filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              (e.category ?? '').toLowerCase().includes(q) ||
              (e.synonyms ?? []).some((s) => s.toLowerCase().includes(q)),
          )
      : this.library.equipmentSorted();

    const fach = this.openFach();
    const id = this.vehicleId();
    if (!fach || !id) return all;
    const inFach = new Set(
      all.filter((e) => this.library.hasPlacement(id, fach, e.id)).map((e) => e.id),
    );
    if (inFach.size === 0) return all;
    return [...all.filter((e) => inFach.has(e.id)), ...all.filter((e) => !inFach.has(e.id))];
  });

  /** Header tally: how much of this truck is loaded. */
  readonly tally = computed(() => {
    const id = this.vehicleId();
    if (!id) return '';
    const placements = this.library.placementsForVehicle(id);
    const used = new Set(placements.map((p) => p.compartmentId)).size;
    return `${placements.length} verlastet · ${used}/${this.compartments().length} Fächer belegt`;
  });

  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  constructor() {
    // Deep-link from the Gerätehaus ("Beladen →"): ?vehicle=<id> opens that truck,
    // otherwise fall back to the starter vehicle.
    const requested = this.route.snapshot.queryParamMap.get('vehicle');
    this.library.ensureStarterVehicle().then((v) => {
      if (this.vehicleId() !== null) return;
      if (requested && this.library.vehicleById(requested)) this.vehicleId.set(requested);
      else if (v) this.vehicleId.set(v.id);
    });
  }

  selectVehicle(id: string): void {
    this.vehicleId.set(id);
    this.openFach.set(null);
    this.activeGeraetId.set(null);
    this.newName.set('');
  }

  /** Schematic tap — selection only, never a write. */
  pickZone(c: CompartmentId): void {
    this.openFach.update((cur) => (cur === c ? null : c));
  }

  /** Row tap — trace where this Gerät lives; tapping it again clears the trace. */
  traceGeraet(equipmentId: string): void {
    this.activeGeraetId.update((cur) => (cur === equipmentId ? null : equipmentId));
  }

  /** Compartments on this vehicle that carry the given item. */
  zonesFor(equipmentId: string): CompartmentId[] {
    const id = this.vehicleId();
    if (!id) return [];
    return this.library
      .placementsForVehicle(id)
      .filter((p) => p.equipmentId === equipmentId)
      .map((p) => p.compartmentId);
  }

  isPlaced(equipmentId: string): boolean {
    const id = this.vehicleId();
    const fach = this.openFach();
    return !!id && !!fach && this.library.hasPlacement(id, fach, equipmentId);
  }

  countIn(fach: CompartmentId): number {
    const id = this.vehicleId();
    if (!id) return 0;
    return this.library.placementsForVehicle(id).filter((p) => p.compartmentId === fach).length;
  }

  compartmentLabel(id: CompartmentId): string {
    return this.compartments().find((c) => c.id === id)?.label ?? id;
  }

  /** The one write: put this Gerät in the open Fach, or take it out. */
  toggle(equipmentId: string): void {
    const id = this.vehicleId();
    const fach = this.openFach();
    if (id && fach) void this.library.togglePlacement(id, fach, equipmentId);
  }

  /** Inline catalog entry, verlastet straight into the open Fach. */
  async addAndPlace(): Promise<void> {
    const name = this.newName().trim();
    const id = this.vehicleId();
    const fach = this.openFach();
    if (!name || !id || !fach) return;
    const item = await this.library.addEquipment(name);
    await this.library.togglePlacement(id, fach, item.id);
    this.newName.set('');
    this.activeGeraetId.set(item.id);
  }

  /** Two/three-letter row mark, mirroring the Geräte-Katalog. */
  abbr(e: Equipment): string {
    if (e.kurzzeichen) return e.kurzzeichen.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
    const words = e.name.split(/[\s-]+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return e.name.slice(0, 2).toUpperCase();
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
