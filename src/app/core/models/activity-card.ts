/**
 * The three ways a term can be performed in Activity. A card is **mode-agnostic**
 * — the board cell a team stands on decides which of these they must do, so the
 * draw pool is one bucket per difficulty rather than one per (mode × difficulty).
 * `ActivityCard.excludeModes` is the narrow opt-out for terms that genuinely
 * cannot be mimed or drawn.
 */
export const PERFORM_MODES = ['Beschreiben', 'Zeichnen', 'Pantomime'] as const;
export type PerformMode = (typeof PERFORM_MODES)[number];

/** What a team gambles on before the card is drawn: more points, less time. */
export const DIFFICULTIES = ['Leicht', 'Mittel', 'Schwer'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Activity **rule data** decorating a catalog Equipment entry — deliberately not
 * folded into `Equipment` itself, which is mode-agnostic domain data (ADR-0004
 * layer 1). `beschreibung`/`verwendung` are facts about a Gerät; Tabu-Wörter and
 * a difficulty rating are rules about a game.
 *
 * Keyed by `equipmentId` so Stufe 2 can look the item's Fach up from the chosen
 * Vehicle's live Placements. The legacy standalone app baked `locations: ['G1']`
 * into each card against one specific truck; here the same card plays correctly
 * on every Vehicle that carries the item.
 *
 * Equipment with no card is simply not playable — an item silently absent beats
 * an item mis-rated by a default.
 */
export interface ActivityCard {
  equipmentId: string;
  difficulty: Difficulty;
  /** Words the performer may not say. Only meaningful for `Beschreiben`. */
  taboo?: string[];
  /** Modes this term cannot sensibly be performed in (e.g. an abstract Tafel). */
  excludeModes?: PerformMode[];
}
