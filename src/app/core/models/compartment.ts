/**
 * Compartment ids for the LF (Fabian's truck). These MUST match the zone ids
 * hard-coded in `shared/lf-sketch.ts` — the LF is the one type with a bespoke
 * schematic. Every other type is drawn from its compartment metadata by
 * `shared/metadata-sketch.ts` (ADR-0003).
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

/** The LF's specific zone ids (hand-crafted LfSketch). */
export type LfCompartmentId = (typeof LF_COMPARTMENT_IDS)[number];

/**
 * A compartment id. Widened to `string` so vehicle types beyond the LF can carry
 * their own compartment layouts (ADR-0003 generic renderer). The LF renderer
 * still works against the concrete `LF_COMPARTMENT_IDS` set above.
 */
export type CompartmentId = string;

/** Which face of the vehicle a compartment sits on — drives the generic renderer. */
export const SIDES = ['left', 'right', 'roof', 'cabin', 'rear'] as const;
export type Side = (typeof SIDES)[number];

export interface Compartment {
  id: CompartmentId;
  label: string;
  side: Side;
  /**
   * Front→rear rank **within its side** — not a global sequence. The generic
   * renderer lays each flank out by it, so per-side ranks must be unique.
   */
  order: number;
}
