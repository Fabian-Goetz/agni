import { Injectable, computed, inject, signal } from '@angular/core';
import { CONTENT_STORE } from '../content/content-store.port';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';
import { Compartment, CompartmentId } from '../models/compartment';

/**
 * App-level facade over the ContentStore. Loads the Library once into signals
 * and centralises the domain operations (clone-on-create per ADR-0001,
 * bidirectional placement editing, inline equipment creation). Components read
 * signals and call these methods; they never touch the store directly.
 */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly store = inject(CONTENT_STORE);

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
    await Promise.all([this.persistVehicles(), this.persistPlacements()]);
    return vehicle;
  }

  /**
   * Guarantee at least one playable Vehicle exists by cloning the first seed
   * type on first run. Returns the vehicle to use.
   */
  async ensureStarterVehicle(): Promise<Vehicle | undefined> {
    await this.ensureLoaded();
    if (this._vehicles().length > 0) return this._vehicles()[0];
    const type = this._vehicleTypes()[0];
    if (!type) return undefined;
    return this.createVehicleFromType(type.name, type.id);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    this._vehicles.update((v) => v.filter((x) => x.id !== vehicleId));
    this._placements.update((p) => p.filter((x) => x.vehicleId !== vehicleId));
    await Promise.all([this.persistVehicles(), this.persistPlacements()]);
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
    this._placements.update((all) =>
      exists
        ? all.filter(
            (p) =>
              !(
                p.vehicleId === vehicleId &&
                p.compartmentId === compartmentId &&
                p.equipmentId === equipmentId
              ),
          )
        : [...all, { vehicleId, compartmentId, equipmentId }],
    );
    await this.persistPlacements();
  }

  /** Create a catalog entry inline; returns it. */
  async addEquipment(name: string, category?: string): Promise<Equipment> {
    const item: Equipment = { id: this.uid('eq'), name: name.trim(), category };
    this._equipment.update((e) => [...e, item]);
    await this.store.saveEquipment(this._equipment());
    return item;
  }

  private persistVehicles(): Promise<void> {
    return this.store.saveVehicles(this._vehicles());
  }
  private persistPlacements(): Promise<void> {
    return this.store.savePlacements(this._placements());
  }

  private uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
