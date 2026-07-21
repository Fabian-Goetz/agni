import { Equipment } from '../models/equipment';
import { CompartmentId } from '../models/compartment';
import { Placement } from '../models/vehicle';

/**
 * A single generated Locate question. Pure data — no UI, no scoring, no players.
 * The reusable core shared by every Game Mode (ADR-0004).
 */
export interface LocateChallenge {
  /** The item the player must locate. */
  subject: Equipment;
  vehicleId: string;
  /** Compartment(s) the item is actually stored in (≥1). */
  correct: CompartmentId[];
  /** All compartments of the vehicle — the tap targets. */
  candidates: CompartmentId[];
}

export interface GenerateLocateArgs {
  subject: Equipment;
  vehicleId: string;
  /** All placements for this vehicle. */
  placements: Placement[];
  /** The vehicle's compartment ids (tap targets). */
  compartmentIds: CompartmentId[];
}

/** Build a Locate challenge for a chosen item. Pure. */
export function generateLocate(args: GenerateLocateArgs): LocateChallenge {
  const correct = args.placements
    .filter((pl) => pl.equipmentId === args.subject.id)
    .map((pl) => pl.compartmentId);
  return {
    subject: args.subject,
    vehicleId: args.vehicleId,
    correct: [...new Set(correct)],
    candidates: args.compartmentIds,
  };
}

/** Did the tapped compartment satisfy the challenge? */
export function isCorrect(challenge: LocateChallenge, picked: CompartmentId): boolean {
  return challenge.correct.includes(picked);
}
