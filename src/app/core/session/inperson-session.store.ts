import { Injectable, computed, inject, signal } from '@angular/core';
import { LibraryService } from '../library/library.service';
import { generateLocate, isCorrect, LocateChallenge } from '../challenge/challenge';
import { shuffle } from '../util/random';
import { Equipment } from '../models/equipment';
import { CompartmentId } from '../models/compartment';
import { RoundConfig } from './round-config';

/** One answered Locate question, kept so the end summary can name the misses. */
export interface RoundAnswer {
  subject: Equipment;
  /** Compartment(s) the item actually lives in. */
  correct: CompartmentId[];
  picked: CompartmentId;
  wasCorrect: boolean;
}

/**
 * In-Person Game Mode session driver (ADR-0004): single device, author-paced,
 * Locate challenges over one Vehicle. A round runs a fixed queue of subjects —
 * every placed item once, shuffled, capped at the chosen question count — and
 * keeps a light tally for the end summary.
 */
@Injectable({ providedIn: 'root' })
export class InPersonSessionStore {
  private readonly library = inject(LibraryService);

  private readonly _config = signal<RoundConfig | null>(null);
  private queue: Equipment[] = [];
  private cursor = 0;

  private readonly _current = signal<LocateChallenge | null>(null);
  private readonly _picked = signal<CompartmentId | null>(null);
  private readonly _asked = signal(0);
  private readonly _correct = signal(0);
  private readonly _total = signal(0);
  private readonly _finished = signal(false);
  private readonly _answers = signal<RoundAnswer[]>([]);

  readonly config = this._config.asReadonly();
  readonly current = this._current.asReadonly();
  readonly picked = this._picked.asReadonly();
  readonly asked = this._asked.asReadonly();
  readonly correctCount = this._correct.asReadonly();
  /** Number of questions the round will ask in total. */
  readonly total = this._total.asReadonly();
  /** True once the queue is exhausted — Play shows the end summary. */
  readonly finished = this._finished.asReadonly();
  /** Every answer given this round, in order asked. Drives the end summary. */
  readonly answers = this._answers.asReadonly();
  /** The ones to go over again — what makes the summary worth reading. */
  readonly missed = computed(() => this._answers().filter((a) => !a.wasCorrect));

  readonly revealed = computed(() => this._picked() !== null);
  readonly lastWasCorrect = computed(() => {
    const c = this._current();
    const p = this._picked();
    return c !== null && p !== null && isCorrect(c, p);
  });

  /** Begin a round from a setup config and deal the first challenge. */
  start(config: RoundConfig): void {
    this._config.set(config);
    const pool = shuffle(this.library.placedEquipment(config.vehicleId));
    this.queue = config.limit === null ? pool : pool.slice(0, config.limit);
    this.cursor = 0;
    this._asked.set(0);
    this._correct.set(0);
    this._total.set(this.queue.length);
    this._finished.set(false);
    this._answers.set([]);
    this.next();
  }

  /** Replay the same round with a freshly shuffled queue. */
  restart(): void {
    const config = this._config();
    if (config) this.start(config);
  }

  /** Deal the next challenge, or finish the round when the queue is empty. */
  next(): void {
    const config = this._config();
    if (!config) return;
    if (this.cursor >= this.queue.length) {
      this._current.set(null);
      this._picked.set(null);
      this._finished.set(true);
      return;
    }
    const subject = this.queue[this.cursor++];
    const compartmentIds = this.library
      .compartmentsForVehicle(config.vehicleId)
      .map((c) => c.id);
    this._picked.set(null);
    this._current.set(
      generateLocate({
        subject,
        vehicleId: config.vehicleId,
        placements: this.library.placementsForVehicle(config.vehicleId),
        compartmentIds,
      }),
    );
    this._asked.update((n) => n + 1);
  }

  /** Register a tap and reveal the answer. */
  pick(compartmentId: CompartmentId): void {
    if (this.revealed()) return;
    const challenge = this._current();
    if (!challenge) return;
    this._picked.set(compartmentId);
    const wasCorrect = this.lastWasCorrect();
    if (wasCorrect) this._correct.update((n) => n + 1);
    this._answers.update((log) => [
      ...log,
      {
        subject: challenge.subject,
        correct: challenge.correct,
        picked: compartmentId,
        wasCorrect,
      },
    ]);
  }
}
