import { InjectionToken } from '@angular/core';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';

/**
 * Persistence seam (ADR-0002). The app depends only on this port. v1 is backed
 * by localStorage; a Supabase adapter implements the same contract and swaps in
 * with zero domain changes. Async from the start so the async Supabase adapter
 * needs no signature change — the local adapter simply resolves immediately.
 */
export interface ContentStore {
  loadVehicleTypes(): Promise<VehicleType[]>;
  saveVehicleTypes(types: VehicleType[]): Promise<void>;

  loadEquipment(): Promise<Equipment[]>;
  saveEquipment(equipment: Equipment[]): Promise<void>;

  loadVehicles(): Promise<Vehicle[]>;
  saveVehicles(vehicles: Vehicle[]): Promise<void>;

  loadPlacements(): Promise<Placement[]>;
  savePlacements(placements: Placement[]): Promise<void>;
}

export const CONTENT_STORE = new InjectionToken<ContentStore>('ContentStore');
