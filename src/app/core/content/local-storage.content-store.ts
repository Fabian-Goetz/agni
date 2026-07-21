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

/**
 * localStorage-backed ContentStore (v1 default). Vehicle types + equipment fall
 * back to shipped DIN seed when nothing is persisted; user-owned vehicles and
 * placements start empty. Plain class taking a raw Storage so tests can inject a
 * fake (mirrors the sibling's adapter pattern).
 */
export class LocalStorageContentStore implements ContentStore {
  constructor(private readonly storage: Storage) {}

  loadVehicleTypes(): Promise<VehicleType[]> {
    return Promise.resolve(this.read<VehicleType[]>(KEYS.vehicleTypes) ?? SEED_VEHICLE_TYPES);
  }
  saveVehicleTypes(types: VehicleType[]): Promise<void> {
    return this.write(KEYS.vehicleTypes, types);
  }

  loadEquipment(): Promise<Equipment[]> {
    return Promise.resolve(this.read<Equipment[]>(KEYS.equipment) ?? SEED_EQUIPMENT);
  }
  saveEquipment(equipment: Equipment[]): Promise<void> {
    return this.write(KEYS.equipment, equipment);
  }

  loadVehicles(): Promise<Vehicle[]> {
    return Promise.resolve(this.read<Vehicle[]>(KEYS.vehicles) ?? []);
  }
  saveVehicles(vehicles: Vehicle[]): Promise<void> {
    return this.write(KEYS.vehicles, vehicles);
  }

  loadPlacements(): Promise<Placement[]> {
    return Promise.resolve(this.read<Placement[]>(KEYS.placements) ?? []);
  }
  savePlacements(placements: Placement[]): Promise<void> {
    return this.write(KEYS.placements, placements);
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
