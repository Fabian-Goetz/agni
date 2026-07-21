import { CompartmentId } from './compartment';

/**
 * A concrete vehicle instance owned by an Author. Created by picking a
 * VehicleType; its loadout is cloned from the type's default and then edited
 * independently (ADR-0001).
 */
export interface Vehicle {
  id: string;
  name: string;
  typeId: string;
}

/** Equipment X is stored in compartment Y of vehicle Z. The fact the game tests. */
export interface Placement {
  vehicleId: string;
  compartmentId: CompartmentId;
  equipmentId: string;
  qty?: number;
}
