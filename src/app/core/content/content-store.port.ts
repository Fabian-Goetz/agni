import { InjectionToken } from '@angular/core';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';

/**
 * Persistence seam (ADR-0002). The app depends only on this port. A localStorage
 * adapter backs local mode; a Supabase adapter implements the same contract and
 * swaps in with zero domain changes. Async from the start so the Supabase adapter
 * needs no signature change — the local adapter simply resolves immediately.
 *
 * Writes are **granular** (add/put/remove one thing), not whole-array saves: this
 * prunes deleted rows correctly and lets RLS scope each mutation to the owner,
 * instead of the delete-all-then-reinsert dance a whole-array save would force.
 * Vehicle types are shared read-only reference data — loaded, never written here.
 */
export interface ContentStore {
  loadVehicleTypes(): Promise<VehicleType[]>;

  loadEquipment(): Promise<Equipment[]>;
  /** Insert or update one catalog entry. */
  addEquipment(equipment: Equipment): Promise<void>;

  loadVehicles(): Promise<Vehicle[]>;
  /** Insert or update one vehicle. */
  putVehicle(vehicle: Vehicle): Promise<void>;
  /** Delete a vehicle and (by cascade) its placements. */
  deleteVehicle(vehicleId: string): Promise<void>;

  loadPlacements(): Promise<Placement[]>;
  /** Append placements (one on toggle, many on clone-on-create). */
  addPlacements(placements: Placement[]): Promise<void>;
  /** Remove the placement matching vehicle + compartment + equipment. */
  removePlacement(placement: Placement): Promise<void>;
}

export const CONTENT_STORE = new InjectionToken<ContentStore>('ContentStore');
