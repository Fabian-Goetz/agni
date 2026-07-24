import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CONTENT_STORE } from '../content/content-store.port';
import { USE_SUPABASE } from '../content/supabase.config';
import { AuthService } from '../auth/auth.service';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';
import { Compartment, CompartmentId } from '../models/compartment';

const samePlacement = (a: Placement, b: Placement): boolean =>
  a.vehicleId === b.vehicleId &&
  a.compartmentId === b.compartmentId &&
  a.equipmentId === b.equipmentId;

/**
 * App-level facade over the ContentStore. Loads the Library once into signals
 * and centralises the domain operations (clone-on-create per ADR-0001,
 * bidirectional placement editing, inline equipment creation). Components read
 * signals and call these methods; they never touch the store directly.
 */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly store = inject(CONTENT_STORE);
  private readonly auth = inject(AuthService);

  private readonly _vehicleTypes = signal<VehicleType[]>([]);
  private readonly _equipment = signal<Equipment[]>([]);
  private readonly _vehicles = signal<Vehicle[]>([]);
  private readonly _placements = signal<Placement[]>([]);
  private readonly _loaded = signal(false);

  readonly vehicleTypes = this._vehicleTypes.asReadonly();
  readonly equipment = this._equipment.asReadonly();
  readonly vehicles = this._vehicles.asReadonly();
  readonly placements = this._placements.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  /** Equipment sorted by name for stable catalog lists. */
  readonly equipmentSorted = computed(() =>
    [...this._equipment()].sort((a, b) => a.name.localeCompare(b.name, 'de')),
  );

  private loadPromise?: Promise<void>;

  constructor() {
    // Under Supabase the Library is per-owner: when the signed-in user changes
    // (initial session restore, sign in as someone else, sign out), drop the
    // cached Library so it never leaks the previous user's rows. This also covers
    // the initial null→user restore — where a component's early ensureLoaded()
    // may have raced the async auth restore — by re-loading for the current user
    // so reference data (equipment/types) isn't left wiped at [].
    if (USE_SUPABASE) {
      let prev: string | null | undefined;
      effect(() => {
        const uid = this.auth.user()?.id ?? null;
        if (prev !== undefined && uid !== prev) {
          this.reset();
          if (uid) void this.ensureLoaded();
        }
        prev = uid;
      });
    }
  }

  /** Clear the in-memory Library so the next ensureLoaded() refetches. */
  reset(): void {
    this.loadPromise = undefined;
    this._loaded.set(false);
    this._vehicleTypes.set([]);
    this._equipment.set([]);
    this._vehicles.set([]);
    this._placements.set([]);
  }

  /** Load the Library once (idempotent). */
  ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const [types, equipment, vehicles, placements] = await Promise.all([
          this.store.loadVehicleTypes(),
          this.store.loadEquipment(),
          this.store.loadVehicles(),
          this.store.loadPlacements(),
        ]);
        this._vehicleTypes.set(types);
        this._equipment.set(equipment);
        this._vehicles.set(vehicles);
        this._placements.set(placements);
        this._loaded.set(true);
      })();
    }
    return this.loadPromise;
  }

  // ---- lookups -----------------------------------------------------------

  typeById(id: string): VehicleType | undefined {
    return this._vehicleTypes().find((t) => t.id === id);
  }

  equipmentById(id: string): Equipment | undefined {
    return this._equipment().find((e) => e.id === id);
  }

  vehicleById(id: string): Vehicle | undefined {
    return this._vehicles().find((v) => v.id === id);
  }

  compartmentsForVehicle(vehicleId: string): Compartment[] {
    const vehicle = this.vehicleById(vehicleId);
    return vehicle ? (this.typeById(vehicle.typeId)?.compartments ?? []) : [];
  }

  placementsForVehicle(vehicleId: string): Placement[] {
    return this._placements().filter((p) => p.vehicleId === vehicleId);
  }

  /**
   * Whether a schematic exists to render this type's compartments. v1 only draws
   * the hand-crafted LfSketch, and the Fahrzeugkatalog types ship as master-data
   * stubs with an empty layout — the generic metadata renderer is still pending
   * (ADR-0003). Everything that shows a schematic (Beladung editor, rounds) must
   * gate on this rather than assume the LF.
   */
  typeHasSchematic(type: VehicleType | undefined): boolean {
    return !!type?.hasCustomSketch && type.compartments.length > 0;
  }

  /** Whether a Vehicle can be loaded in the editor and drilled in a round. */
  hasSchematic(vehicleId: string): boolean {
    const vehicle = this.vehicleById(vehicleId);
    return !!vehicle && this.typeHasSchematic(this.typeById(vehicle.typeId));
  }

  /** Distinct equipment that has at least one placement on the vehicle. */
  placedEquipment(vehicleId: string): Equipment[] {
    const ids = new Set(this.placementsForVehicle(vehicleId).map((p) => p.equipmentId));
    return this._equipment().filter((e) => ids.has(e.id));
  }

  // ---- mutations ---------------------------------------------------------

  /** Create a Vehicle from a type, cloning its default DIN loadout (ADR-0001). */
  async createVehicleFromType(name: string, typeId: string): Promise<Vehicle> {
    const type = this.typeById(typeId);
    if (!type) throw new Error(`Unknown vehicle type: ${typeId}`);
    const vehicle: Vehicle = { id: this.uid('veh'), name, typeId };
    const cloned: Placement[] = type.defaultLoadout.map((d) => ({
      vehicleId: vehicle.id,
      compartmentId: d.compartmentId,
      equipmentId: d.equipmentId,
      qty: d.qty,
    }));
    this._vehicles.update((v) => [...v, vehicle]);
    this._placements.update((p) => [...p, ...cloned]);
    await this.store.putVehicle(vehicle); // vehicle first: placements FK it
    await this.store.addPlacements(cloned);
    return vehicle;
  }

  /**
   * Guarantee at least one playable Vehicle exists by cloning a seed type on
   * first run. Prefers a type that actually carries a loadout — the catalog now
   * also holds master-data stubs (empty compartments) which would make an empty
   * starter vehicle. Returns the vehicle to use.
   */
  async ensureStarterVehicle(): Promise<Vehicle | undefined> {
    await this.ensureLoaded();
    if (this._vehicles().length > 0) return this._vehicles()[0];
    const types = this._vehicleTypes();
    const type =
      types.find((t) => t.hasCustomSketch) ??
      types.find((t) => t.defaultLoadout.length > 0) ??
      types[0];
    if (!type) return undefined;
    return this.createVehicleFromType(type.name, type.id);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    this._vehicles.update((v) => v.filter((x) => x.id !== vehicleId));
    this._placements.update((p) => p.filter((x) => x.vehicleId !== vehicleId));
    await this.store.deleteVehicle(vehicleId); // placements cascade in the store
  }

  /** Rename a Vehicle (its type and loadout are untouched). */
  async renameVehicle(vehicleId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    let updated: Vehicle | undefined;
    this._vehicles.update((all) =>
      all.map((v) => (v.id === vehicleId ? (updated = { ...v, name: trimmed }) : v)),
    );
    if (updated) await this.store.putVehicle(updated);
  }

  hasPlacement(vehicleId: string, compartmentId: CompartmentId, equipmentId: string): boolean {
    return this._placements().some(
      (p) =>
        p.vehicleId === vehicleId &&
        p.compartmentId === compartmentId &&
        p.equipmentId === equipmentId,
    );
  }

  /** Toggle a placement on/off (bidirectional editing entry point). */
  async togglePlacement(
    vehicleId: string,
    compartmentId: CompartmentId,
    equipmentId: string,
  ): Promise<void> {
    const exists = this.hasPlacement(vehicleId, compartmentId, equipmentId);
    const placement: Placement = { vehicleId, compartmentId, equipmentId };
    this._placements.update((all) =>
      exists ? all.filter((p) => !samePlacement(p, placement)) : [...all, placement],
    );
    if (exists) await this.store.removePlacement(placement);
    else await this.store.addPlacements([placement]);
  }

  /** Create a catalog entry inline; returns it. */
  async addEquipment(name: string, category?: string): Promise<Equipment> {
    const item: Equipment = { id: this.uid('eq'), name: name.trim(), category };
    this._equipment.update((e) => [...e, item]);
    await this.store.addEquipment(item);
    return item;
  }

  private uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
