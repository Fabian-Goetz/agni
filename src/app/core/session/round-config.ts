/** Games launchable into the In-Person session (see docs/design/game-catalog.md). */
export type GameId = 'fach-finder' | 'geraet-holen';

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
}

/**
 * v1 launchable games. Both are Family-1 Schematic games (ADR-0003): Fach-Finder
 * is the solo/group classic; Gerät holen wraps the same content in a physical
 * relay. They share the Locate engine until a dedicated relay loop exists.
 */
export const GAMES: Record<GameId, GameMeta> = {
  'fach-finder': {
    id: 'fach-finder',
    name: 'Fach-Finder',
    tagline: 'Gerät zeigen → richtiges Fach antippen → aufdecken.',
  },
  'geraet-holen': {
    id: 'geraet-holen',
    name: 'Gerät holen',
    tagline: 'Ansage: ein Gerät — wer bringt es zuerst? Staffel gegen die Uhr.',
  },
};

/** Narrow an arbitrary route value to a known game, defaulting to Fach-Finder. */
export function toGameId(value: unknown): GameId {
  return value === 'geraet-holen' ? 'geraet-holen' : 'fach-finder';
}
