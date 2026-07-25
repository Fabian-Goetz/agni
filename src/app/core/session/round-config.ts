/** Games launchable into the In-Person session (see docs/design/game-catalog.md). */
export type GameId = 'fach-finder' | 'geraet-holen' | 'activity';

/** Everything the setup screen collects before a round begins. Pure data. */
export interface RoundConfig {
  vehicleId: string;
  game: GameId;
  /** Max questions; `null` = every placed item on the vehicle, once. */
  limit: number | null;
}

export interface GameMeta {
  id: GameId;
  name: string;
  /** One-line framing shown under the title. */
  tagline: string;
  /**
   * Where the launcher sends this game. Fach-Finder and Gerät holen share the
   * lean `/select` setup and the Locate loop; Activity runs its own setup and
   * session driver, because teams, a board and a three-Stufen chain do not fit
   * a screen deliberately kept to "which vehicle, how many questions".
   */
  route: string;
}

/**
 * v1 launchable games. Fach-Finder and Gerät holen are Family-1 Schematic games
 * (ADR-0003) sharing the Locate engine until a dedicated relay loop exists.
 * Activity is the first **composite** game: it chains Perform → Locate → Fetch
 * inside one Zug (ADR-0006).
 */
export const GAMES: Record<GameId, GameMeta> = {
  'fach-finder': {
    id: 'fach-finder',
    name: 'Fach-Finder',
    tagline: 'Gerät zeigen → richtiges Fach antippen → aufdecken.',
    route: '/select',
  },
  'geraet-holen': {
    id: 'geraet-holen',
    name: 'Gerät holen',
    tagline: 'Ansage: ein Gerät — wer bringt es zuerst? Staffel gegen die Uhr.',
    route: '/select',
  },
  activity: {
    id: 'activity',
    name: 'Activity',
    tagline: 'Beschreiben · Zeichnen · Pantomime — dann Fach zeigen und Gerät holen.',
    route: '/activity',
  },
};

/**
 * Narrow an arbitrary route value to a game that `/select` can set up. Activity
 * never arrives here — it has its own setup screen — so it is not a candidate.
 */
export function toGameId(value: unknown): GameId {
  return value === 'geraet-holen' ? 'geraet-holen' : 'fach-finder';
}
