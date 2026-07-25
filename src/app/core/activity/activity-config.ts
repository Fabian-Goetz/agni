import { Difficulty } from '../models/activity-card';

/**
 * Which Stufen a Zug runs through. Stufe 1 (perform & guess) is the game's
 * identity and cannot be switched off; the other two are independent.
 */
export interface StufenConfig {
  /** Stufe 2 — point at the Fach on the vehicle schematic. Auto-verified. */
  locate: boolean;
  /** Stufe 3 — physically fetch the item. Moderator-verified, own clock. */
  fetch: boolean;
}

/** Everything the Activity setup screen collects before a game begins. Pure data. */
export interface ActivityConfig {
  /** The Vehicle Stufe 2 is drilled against; also narrows the card pool. */
  vehicleId: string;
  /** Team names in entry order; one team = solo (scored in Zügen bis Ziel). */
  teams: string[];
  stufen: StufenConfig;
  /** Stufe 1 points, by the difficulty the team gambled on. */
  points: Record<Difficulty, number>;
  /** Flat bonus for clearing Stufe 2 — deliberately not difficulty-scaled. */
  locateBonus: number;
  /** Flat bonus for clearing Stufe 3; higher, because fetching costs legs. */
  fetchBonus: number;
  /** Stufe 1 countdown, by difficulty — shorter on harder cards, so Schwer gambles. */
  roundSeconds: Record<Difficulty, number>;
  /** Stufe 3 countdown. A bay-length relay cannot share a 35 s Pantomime clock. */
  fetchSeconds: number;
}

/** How many teams the setup screen offers. The rules core is generic over N. */
export const MAX_TEAMS = 4;

/**
 * The standalone app's proven numbers, extended with the two new Stufen. Stufe 2
 * is on and Stufe 3 off by default — that is the shape the legacy game shipped in.
 */
export const DEFAULT_ACTIVITY_CONFIG: Omit<ActivityConfig, 'vehicleId' | 'teams'> = {
  stufen: { locate: true, fetch: false },
  points: { Leicht: 2, Mittel: 3, Schwer: 5 },
  locateBonus: 2,
  fetchBonus: 3,
  roundSeconds: { Leicht: 75, Mittel: 55, Schwer: 35 },
  fetchSeconds: 60,
};
