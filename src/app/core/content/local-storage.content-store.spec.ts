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

  it('round-trips vehicles and placements via granular ops', async () => {
    const vehicle: Vehicle = { id: 'v1', name: 'LF', typeId: 'lf-fabian' };
    const placement: Placement = { vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'motorsaege' };
    await store.putVehicle(vehicle);
    await store.addPlacements([placement]);
    expect(await store.loadVehicles()).toEqual([vehicle]);
    expect(await store.loadPlacements()).toEqual([placement]);
  });

  it('removePlacement drops only the matching placement', async () => {
    const keep: Placement = { vehicleId: 'v1', compartmentId: 'G1', equipmentId: 'verteiler' };
    const drop: Placement = { vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'motorsaege' };
    await store.addPlacements([keep, drop]);
    await store.removePlacement(drop);
    expect(await store.loadPlacements()).toEqual([keep]);
  });

  it('deleteVehicle prunes the vehicle and cascades its placements', async () => {
    await store.putVehicle({ id: 'v1', name: 'LF', typeId: 'lf-fabian' });
    await store.putVehicle({ id: 'v2', name: 'HLF', typeId: 'lf-fabian' });
    await store.addPlacements([
      { vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'motorsaege' },
      { vehicleId: 'v2', compartmentId: 'G1', equipmentId: 'verteiler' },
    ]);
    await store.deleteVehicle('v1');
    expect(await store.loadVehicles()).toEqual([{ id: 'v2', name: 'HLF', typeId: 'lf-fabian' }]);
    expect(await store.loadPlacements()).toEqual([
      { vehicleId: 'v2', compartmentId: 'G1', equipmentId: 'verteiler' },
    ]);
  });

  it('addEquipment appends onto the seed catalog', async () => {
    await store.addEquipment({ id: 'custom', name: 'Spezialgerät', category: 'Sonder' });
    const all = await store.loadEquipment();
    expect(all).toContainEqual({ id: 'custom', name: 'Spezialgerät', category: 'Sonder' });
    expect(all.length).toBe(SEED_EQUIPMENT.length + 1);
  });

  it('tolerates corrupt json by falling back', async () => {
    const fake = new FakeStorage();
    fake.setItem('fk.vehicles', '{not json');
    const s = new LocalStorageContentStore(fake);
    expect(await s.loadVehicles()).toEqual([]);
  });
});
