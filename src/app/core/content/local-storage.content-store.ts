import { ContentStore } from './content-store.port';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';
import { SEED_VEHICLE_TYPES, SEED_EQUIPMENT } from '../seed/seed-lf';

const KEYS = {
  vehicleTypes: 'fk.vehicleTypes',
  equipment: 'fk.equipment',
  vehicles: 'fk.vehicles',
  placements: 'fk.placements',
} as const;

const samePlacement = (a: Placement, b: Placement): boolean =>
  a.vehicleId === b.vehicleId &&
  a.compartmentId === b.compartmentId &&
  a.equipmentId === b.equipmentId;

/**
 * localStorage-backed ContentStore (local mode). Vehicle types + equipment fall
 * back to shipped DIN seed when nothing is persisted; user-owned vehicles and
 * placements start empty. Plain class taking a raw Storage so tests can inject a
 * fake (mirrors the sibling's adapter pattern).
 */
export class LocalStorageContentStore implements ContentStore {
  constructor(private readonly storage: Storage) {}

  loadVehicleTypes(): Promise<VehicleType[]> {
    return Promise.resolve(this.read<VehicleType[]>(KEYS.vehicleTypes) ?? SEED_VEHICLE_TYPES);
  }

  loadEquipment(): Promise<Equipment[]> {
    return Promise.resolve(this.read<Equipment[]>(KEYS.equipment) ?? SEED_EQUIPMENT);
  }
  addEquipment(equipment: Equipment): Promise<void> {
    const all = this.read<Equipment[]>(KEYS.equipment) ?? SEED_EQUIPMENT;
    return this.write(KEYS.equipment, [...all.filter((e) => e.id !== equipment.id), equipment]);
  }

  loadVehicles(): Promise<Vehicle[]> {
    return Promise.resolve(this.read<Vehicle[]>(KEYS.vehicles) ?? []);
  }
  putVehicle(vehicle: Vehicle): Promise<void> {
    const all = this.read<Vehicle[]>(KEYS.vehicles) ?? [];
    return this.write(KEYS.vehicles, [...all.filter((v) => v.id !== vehicle.id), vehicle]);
  }
  async deleteVehicle(vehicleId: string): Promise<void> {
    const vehicles = (this.read<Vehicle[]>(KEYS.vehicles) ?? []).filter((v) => v.id !== vehicleId);
    const placements = (this.read<Placement[]>(KEYS.placements) ?? []).filter(
      (p) => p.vehicleId !== vehicleId,
    );
    await this.write(KEYS.vehicles, vehicles);
    await this.write(KEYS.placements, placements);
  }

  loadPlacements(): Promise<Placement[]> {
    return Promise.resolve(this.read<Placement[]>(KEYS.placements) ?? []);
  }
  addPlacements(placements: Placement[]): Promise<void> {
    const all = this.read<Placement[]>(KEYS.placements) ?? [];
    return this.write(KEYS.placements, [...all, ...placements]);
  }
  removePlacement(placement: Placement): Promise<void> {
    const all = this.read<Placement[]>(KEYS.placements) ?? [];
    return this.write(
      KEYS.placements,
      all.filter((p) => !samePlacement(p, placement)),
    );
  }

  private read<T>(key: string): T | null {
    const raw = this.storage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): Promise<void> {
    this.storage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  }
}
