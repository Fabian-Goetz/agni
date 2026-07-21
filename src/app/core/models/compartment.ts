/**
 * Compartment ids for the LF (Fabian's truck). These MUST match the zone ids
 * hard-coded in `shared/lf-sketch.ts` — the v1 schematic is the reused LfSketch.
 * Future vehicle types drive a generic metadata renderer instead (ADR-0003).
 */
export const LF_COMPARTMENT_IDS = [
  'Fahrerkabine',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'Angriffstrupp',
  'Bank hinten',
  'Dach',
] as const;

export type CompartmentId = (typeof LF_COMPARTMENT_IDS)[number];

/** Which face of the vehicle a compartment sits on — drives the generic renderer. */
export const SIDES = ['left', 'right', 'roof', 'cabin', 'rear'] as const;
export type Side = (typeof SIDES)[number];

export interface Compartment {
  id: CompartmentId;
  label: string;
  side: Side;
  /** Front→rear ordering within a side; drives layout for the generic renderer. */
  order: number;
}
