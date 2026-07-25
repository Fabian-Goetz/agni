import { Equipment } from '../models/equipment';
import { ActivityCard, Difficulty, PerformMode } from '../models/activity-card';
import { Selector } from '../util/random';

/**
 * A single generated Perform question: show this term to one player, who acts it
 * out for their team. Pure data — no UI, no scoring, no players.
 *
 * Unlike `LocateChallenge` it carries **no verdict function**: whether the team
 * guessed the term is not computable, a moderator calls it. The Session driver
 * records that call (ADR-0006).
 */
export interface PerformChallenge {
  subject: Equipment;
  mode: PerformMode;
  difficulty: Difficulty;
  /** Words the performer may not say — empty for Zeichnen/Pantomime. */
  taboo: string[];
}

/** A card paired with the catalog entry it decorates. The round's draw pool. */
export interface PerformCandidate {
  card: ActivityCard;
  subject: Equipment;
}

/** Cards playable in this mode at this difficulty. Pure. */
export function eligible(
  pool: PerformCandidate[],
  mode: PerformMode,
  difficulty: Difficulty,
): PerformCandidate[] {
  return pool.filter(
    (c) => c.card.difficulty === difficulty && !(c.card.excludeModes ?? []).includes(mode),
  );
}

/** Build a Perform challenge from a chosen candidate. Pure. */
export function generatePerform(
  candidate: PerformCandidate,
  mode: PerformMode,
): PerformChallenge {
  return {
    subject: candidate.subject,
    mode,
    difficulty: candidate.card.difficulty,
    // Tabu-Wörter only bite when the performer may speak.
    taboo: mode === 'Beschreiben' ? (candidate.card.taboo ?? []) : [],
  };
}

/**
 * Draws cards without repeating within the last `recentLimit` for the same
 * difficulty. Ported from the standalone app's `CardPicker`, but keyed on
 * difficulty alone: cards are mode-agnostic here, so a term seen as Pantomime
 * shouldn't come straight back as Zeichnen either.
 */
export class PerformPicker {
  private readonly recent = new Map<Difficulty, string[]>();

  constructor(
    private readonly select: Selector<PerformCandidate>,
    private readonly recentLimit = 5,
  ) {}

  pick(
    pool: PerformCandidate[],
    mode: PerformMode,
    difficulty: Difficulty,
  ): PerformChallenge | null {
    const matches = eligible(pool, mode, difficulty);
    if (matches.length === 0) return null;

    const recent = this.recent.get(difficulty) ?? [];
    const fresh = matches.filter((c) => !recent.includes(c.card.equipmentId));
    // Fall back to the full set once everything is "recent" — a small pool must
    // still deal a card rather than stall the turn.
    const chosen = this.select(fresh.length > 0 ? fresh : matches);

    this.recent.set(difficulty, [...recent, chosen.card.equipmentId].slice(-this.recentLimit));
    return generatePerform(chosen, mode);
  }
}
