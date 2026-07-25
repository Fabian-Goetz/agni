import { Injectable, computed, inject, signal } from '@angular/core';
import { LibraryService } from '../library/library.service';
import { PerformCandidate, PerformPicker } from '../challenge/perform';
import { randomSelect, shuffle } from '../util/random';
import { CompartmentId } from '../models/compartment';
import { Difficulty } from '../models/activity-card';
import { ActivityConfig } from './activity-config';
import { ActivityGame } from './activity-game';
import { DEFAULT_BOARD } from './board';

/**
 * Activity's Session driver (ADR-0004): single device, moderator-paced, teams
 * racing a board at the real truck.
 *
 * It owns everything Angular — DI, the Library lookups that build the draw pool,
 * and the two countdowns — and delegates every rule to the plain-class
 * `ActivityGame`. Keeping the clocks out here is deliberate: a timer is the one
 * thing that cannot be unit-tested without faking time, and it is not a rule.
 *
 * Left entirely separate from `InPersonSessionStore`, which is a flat shuffled
 * queue with no teams, turns, board or stage chain — folding Activity into it
 * would put the shipped Fach-Finder path at risk for nothing.
 */
@Injectable({ providedIn: 'root' })
export class ActivitySessionStore {
  private readonly library = inject(LibraryService);

  private readonly _config = signal<ActivityConfig | null>(null);
  private readonly _game = signal<ActivityGame | null>(null);
  private readonly _secondsLeft = signal(0);
  private readonly _clockTotal = signal(0);
  private ticker: ReturnType<typeof setInterval> | null = null;

  readonly config = this._config.asReadonly();
  readonly game = this._game.asReadonly();
  /** Remaining seconds on whichever clock is running; `0` when none is. */
  readonly secondsLeft = this._secondsLeft.asReadonly();
  /** What that clock started at — the denominator for the countdown rail. */
  readonly clockTotal = this._clockTotal.asReadonly();

  readonly stage = computed(() => this._game()?.stage() ?? null);
  readonly teams = computed(() => this._game()?.teams ?? []);
  readonly positions = computed(() => this._game()?.positions() ?? []);
  readonly currentTeam = computed(() => this._game()?.currentTeam() ?? null);
  readonly currentTeamName = computed(() => {
    const game = this._game();
    const team = game?.currentTeam();
    return game && team !== null && team !== undefined ? game.teams[team] : '';
  });
  readonly currentMode = computed(() => this._game()?.currentMode() ?? null);
  readonly perform = computed(() => this._game()?.perform() ?? null);
  readonly locate = computed(() => this._game()?.locate() ?? null);
  readonly picked = computed(() => this._game()?.picked() ?? null);
  readonly locateRevealed = computed(() => this._game()?.locateRevealed() ?? false);
  readonly locateWasCorrect = computed(() => this._game()?.locateWasCorrect() ?? false);
  readonly banked = computed(() => this._game()?.banked() ?? 0);
  readonly outcome = computed(() => this._game()?.outcome() ?? null);
  readonly skipUsed = computed(() => this._game()?.skipUsed() ?? false);
  readonly soloResult = computed(() => this._game()?.soloResult() ?? null);
  readonly log = computed(() => this._game()?.log() ?? []);

  private readonly _poolSize = signal(0);
  /** Cards the round can deal — zero means an unplayable setup, and must be said. */
  readonly poolSize = this._poolSize.asReadonly();

  /**
   * Build the draw pool and start a game.
   *
   * When Stufe 2 is on, the pool is intersected with the vehicle's placed
   * equipment: the Fach question has no answer for an item the truck doesn't
   * carry. With Stufe 2 off the whole card catalog is fair game.
   */
  start(config: ActivityConfig): void {
    this.stopClock();
    const pool = this.buildPool(config);
    this._poolSize.set(pool.length);
    this._config.set(config);
    this._game.set(
      new ActivityGame({
        config,
        board: DEFAULT_BOARD,
        pool,
        placements: this.library.placementsForVehicle(config.vehicleId),
        compartmentIds: this.library.compartmentsForVehicle(config.vehicleId).map((c) => c.id),
        picker: new PerformPicker(randomSelect),
        shuffle,
      }),
    );
    this._secondsLeft.set(0);
  }

  /** Replay with the same setup — fresh turn order, fresh board. */
  restart(): void {
    const config = this._config();
    if (config) this.start(config);
  }

  private buildPool(config: ActivityConfig): PerformCandidate[] {
    const placed = config.stufen.locate
      ? new Set(this.library.placedEquipment(config.vehicleId).map((e) => e.id))
      : null;
    const candidates: PerformCandidate[] = [];
    for (const card of this.library.activityCards()) {
      if (placed && !placed.has(card.equipmentId)) continue;
      const subject = this.library.equipmentById(card.equipmentId);
      if (subject) candidates.push({ card, subject });
    }
    return candidates;
  }

  // ---- delegated turn actions ---------------------------------------------

  available(difficulty: Difficulty): number {
    return this._game()?.available(difficulty) ?? 0;
  }

  pointsFor(difficulty: Difficulty): number {
    return this._game()?.pointsFor(difficulty) ?? 0;
  }

  beginTurn(difficulty: Difficulty): void {
    this._game()?.beginTurn(difficulty);
  }

  /** Card goes visible and the Stufe 1 clock starts in the same beat. */
  reveal(): void {
    const game = this._game();
    if (!game) return;
    game.reveal();
    if (game.stage() === 'perform') this.startClock(game.performSeconds);
  }

  skip(): void {
    this._game()?.skip();
  }

  resolvePerform(guessed: boolean): void {
    const game = this._game();
    if (!game) return;
    this.stopClock();
    game.resolvePerform(guessed);
    // Stufe 2 is untimed on purpose; only a jump straight to Stufe 3 re-arms a clock.
    if (game.stage() === 'fetch') this.startClock(game.fetchSeconds);
  }

  pickCompartment(compartmentId: CompartmentId): void {
    this._game()?.pickCompartment(compartmentId);
  }

  continueFromLocate(): void {
    const game = this._game();
    if (!game) return;
    game.continueFromLocate();
    if (game.stage() === 'fetch') this.startClock(game.fetchSeconds);
  }

  resolveFetch(fetched: boolean): void {
    this.stopClock();
    this._game()?.resolveFetch(fetched);
  }

  nextTurn(): void {
    this.stopClock();
    this._game()?.nextTurn();
  }

  /** Drop the game so a re-entered screen has nothing stale to resume. */
  reset(): void {
    this.stopClock();
    this._game.set(null);
    this._config.set(null);
    this._secondsLeft.set(0);
    this._clockTotal.set(0);
  }

  // ---- clocks --------------------------------------------------------------

  private startClock(seconds: number): void {
    this.stopClock();
    if (seconds <= 0) return;
    this._secondsLeft.set(seconds);
    this._clockTotal.set(seconds);
    this.ticker = setInterval(() => {
      const left = this._secondsLeft() - 1;
      this._secondsLeft.set(Math.max(0, left));
      if (left <= 0) {
        this.stopClock();
        this._game()?.expire();
      }
    }, 1000);
  }

  private stopClock(): void {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
}
