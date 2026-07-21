import { Compartment, CompartmentId } from './compartment';

/** A default DIN placement: equipment lives in a compartment (type-level template). */
export interface DefaultPlacement {
  compartmentId: CompartmentId;
  equipmentId: string;
  qty?: number;
}

/**
 * A DIN vehicle type. Owns the fixed compartment layout and the normative
 * default loadout. Ships as seed content; cloned into Vehicle instances
 * (clone-on-create, ADR-0001). Not edited by end users in v1.
 */
export interface VehicleType {
  id: string;
  /** e.g. "LF 20". */
  name: string;
  compartments: Compartment[];
  defaultLoadout: DefaultPlacement[];
  /** True when a hand-crafted schematic exists (v1: the LF via LfSketch). */
  hasCustomSketch?: boolean;
}
