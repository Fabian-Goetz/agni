import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageContentStore } from './local-storage.content-store';
import { SEED_EQUIPMENT, SEED_VEHICLE_TYPES } from '../seed/seed-lf';
import { Vehicle, Placement } from '../models/vehicle';

class FakeStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('LocalStorageContentStore', () => {
  let store: LocalStorageContentStore;

  beforeEach(() => {
    store = new LocalStorageContentStore(new FakeStorage());
  });

  it('falls back to seed types and equipment when nothing is stored', async () => {
    expect(await store.loadVehicleTypes()).toEqual(SEED_VEHICLE_TYPES);
    expect(await store.loadEquipment()).toEqual(SEED_EQUIPMENT);
  });

  it('starts with no vehicles or placements', async () => {
    expect(await store.loadVehicles()).toEqual([]);
    expect(await store.loadPlacements()).toEqual([]);
  });

  it('round-trips vehicles and placements', async () => {
    const vehicles: Vehicle[] = [{ id: 'v1', name: 'LF', typeId: 'lf-fabian' }];
    const placements: Placement[] = [{ vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'motorsaege' }];
    await store.saveVehicles(vehicles);
    await store.savePlacements(placements);
    expect(await store.loadVehicles()).toEqual(vehicles);
    expect(await store.loadPlacements()).toEqual(placements);
  });

  it('tolerates corrupt json by falling back', async () => {
    const fake = new FakeStorage();
    fake.setItem('fk.vehicles', '{not json');
    const s = new LocalStorageContentStore(fake);
    expect(await s.loadVehicles()).toEqual([]);
  });
});
