import { Signal, computed, signal } from '@angular/core';
import { Equipment } from '../models/equipment';
import { CompartmentId } from '../models/compartment';
import { Placement } from '../models/vehicle';
import { Difficulty, PerformMode } from '../models/activity-card';
import { LocateChallenge, generateLocate, isCorrect } from '../challenge/challenge';
import { PerformCandidate, PerformChallenge, PerformPicker, eligible } from '../challenge/perform';
import { ActivityConfig } from './activity-config';
import { BoardCell } from './board';

/**
 * Where a Zug currently stands.
 *
 * `board` → pick a difficulty · `handoff` → pass the tablet to the performer ·
 * `perform` → card + clock · `locate` → tap the Fach · `fetch` → go and get it ·
 * `result` → what the Zug earned · `over` → someone reached Ziel.
 */
export type Stage = 'board' | 'handoff' | 'perform' | 'locate' | 'fetch' | 'result' | 'over';

/** What a finished Zug earned, and which Stufen got there. Drives the result view. */
export interface TurnOutcome {
  team: number;
  subject: Equipment;
  mode: PerformMode;
  difficulty: Difficulty;
  guessed: boolean;
  /** `null` when the Stufe was disabled or never reached. */
  located: boolean | null;
  fetched: boolean | null;
  /** Where the item actually lives — named in the result even on a loss. */
  correctCompartments: CompartmentId[];
  pickedCompartment: CompartmentId | null;
  points: number;
}

/** Solo scoring: one crew, ranked by how few Züge it took to reach Ziel. */
export interface SoloResult {
  crew: string;
  zuege: number;
}

export interface ActivityGameDeps {
  config: ActivityConfig;
  board: BoardCell[];
  /** Cards paired with their catalog entry — already narrowed to the vehicle. */
  pool: PerformCandidate[];
  /** Placements of the configured Vehicle, for Stufe 2. */
  placements: Placement[];
  /** The Vehicle's compartment ids — the Stufe 2 tap targets. */
  compartmentIds: CompartmentId[];
  picker: PerformPicker;
  /** Injected so tests get a deterministic turn order. */
  shuffle?: (order: number[]) => number[];
}

/**
 * Activity's rules — board race, turn order, the Stufen chain, and scoring.
 *
 * A **plain class**, not an Angular service: the rules are the part worth testing
 * hard, and this way they are unit-tested without TestBed (the pattern the
 * standalone app proved out). `ActivitySessionStore` wraps it for DI and owns the
 * clocks. The chain lives here and never in the Challenge engine — the engine
 * generates atomic challenges, the driver composes and scores them (ADR-0006).
 *
 * **Strict chain:** a failed Stufe ends the Zug, but points already banked in
 * earlier Stufen are kept. You cannot locate a word nobody guessed, so the chain
 * is genuinely dependent — but a team that guessed and then misplaced still
 * earned the guess.
 */
export class ActivityGame {
  private readonly config: ActivityConfig;
  private readonly board: BoardCell[];
  private readonly pool: PerformCandidate[];
  private readonly placements: Placement[];
  private readonly compartmentIds: CompartmentId[];
  private readonly picker: PerformPicker;
  private readonly shuffle: (order: number[]) => number[];

  private readonly _positions = signal<number[]>([]);
  private readonly _turnOrder = signal<number[]>([]);
  private readonly _turnIdx = signal(0);
  private readonly _finished = signal<number[]>([]);
  private readonly _turnsByTeam = signal<number[]>([]);
  private readonly _zuege = signal(0);
  private readonly _soloResult = signal<SoloResult | null>(null);

  private readonly _stage = signal<Stage>('board');
  private readonly _perform = signal<PerformChallenge | null>(null);
  private readonly _locate = signal<LocateChallenge | null>(null);
  private readonly _picked = signal<CompartmentId | null>(null);
  private readonly _banked = signal(0);
  private readonly _outcome = signal<TurnOutcome | null>(null);
  private readonly _log = signal<TurnOutcome[]>([]);
  private readonly _skipUsed = signal(false);

  readonly teams: string[];
  readonly positions: Signal<number[]> = this._positions.asReadonly();
  readonly finished: Signal<number[]> = this._finished.asReadonly();
  readonly turnsByTeam: Signal<number[]> = this._turnsByTeam.asReadonly();
  /** Total Züge played across all teams — the solo score. */
  readonly zuege: Signal<number> = this._zuege.asReadonly();
  readonly soloResult: Signal<SoloResult | null> = this._soloResult.asReadonly();

  readonly stage: Signal<Stage> = this._stage.asReadonly();
  readonly perform: Signal<PerformChallenge | null> = this._perform.asReadonly();
  readonly locate: Signal<LocateChallenge | null> = this._locate.asReadonly();
  readonly picked: Signal<CompartmentId | null> = this._picked.asReadonly();
  /** Points earned so far in the Zug in progress. */
  readonly banked: Signal<number> = this._banked.asReadonly();
  readonly outcome: Signal<TurnOutcome | null> = this._outcome.asReadonly();
  /** Every finished Zug, in order played. */
  readonly log: Signal<TurnOutcome[]> = this._log.asReadonly();
  readonly skipUsed: Signal<boolean> = this._skipUsed.asReadonly();

  readonly isSolo: boolean;

  constructor(deps: ActivityGameDeps) {
    this.config = deps.config;
    this.board = deps.board;
    this.pool = deps.pool;
    this.placements = deps.placements;
    this.compartmentIds = deps.compartmentIds;
    this.picker = deps.picker;
    this.shuffle = deps.shuffle ?? ((order) => order);

    this.teams = [...deps.config.teams];
    this.isSolo = this.teams.length === 1;

    this._positions.set(this.teams.map(() => 0));
    this._turnOrder.set(this.shuffle(this.teams.map((_, i) => i)));
    this._turnsByTeam.set(this.teams.map(() => 0));
  }

  // ---- derived state -------------------------------------------------------

  /** Whose Zug it is; `null` once every team has reached Ziel. */
  readonly currentTeam = computed<number | null>(() => {
    const order = this._turnOrder();
    if (order.length === 0) return null;
    const done = this._finished();
    for (let i = 0; i < order.length; i++) {
      const team = order[(this._turnIdx() + i) % order.length];
      if (!done.includes(team)) return team;
    }
    return null;
  });

  /** The board cell the current team stands on — this Zug's performance mode. */
  readonly currentMode = computed<PerformMode | null>(() => {
    const team = this.currentTeam();
    if (team === null) return null;
    const cell = this.board[this._positions()[team]];
    return cell === 'Ziel' ? null : cell;
  });

  /**
   * First team to Ziel ends it. Not "once every team has finished": this is a
   * race, and the turn order is shuffled at kickoff so going first is already
   * luck of the draw rather than a standing advantage.
   */
  readonly isOver = computed(
    () => this.teams.length > 0 && (this._finished().length > 0 || this.currentTeam() === null),
  );

  /** Stufe 2 reveal: the tap has landed and the verdict is on screen. */
  readonly locateRevealed = computed(() => this._picked() !== null);

  readonly locateWasCorrect = computed(() => {
    const challenge = this._locate();
    const picked = this._picked();
    return challenge !== null && picked !== null && isCorrect(challenge, picked);
  });

  get boardCells(): readonly BoardCell[] {
    return this.board;
  }

  get goalIndex(): number {
    return this.board.length - 1;
  }

  /** Stufe 1 clock for the difficulty in play; `0` when no card is running. */
  get performSeconds(): number {
    const challenge = this._perform();
    return challenge ? this.config.roundSeconds[challenge.difficulty] : 0;
  }

  get fetchSeconds(): number {
    return this.config.fetchSeconds;
  }

  /** Whether a difficulty can be gambled on at all — the pool may not cover it. */
  available(difficulty: Difficulty): number {
    const mode = this.currentMode();
    return mode === null ? 0 : eligible(this.pool, mode, difficulty).length;
  }

  pointsFor(difficulty: Difficulty): number {
    return this.config.points[difficulty];
  }

  // ---- the Zug -------------------------------------------------------------

  /**
   * Gamble on a difficulty and draw a card. Lands on `handoff` rather than
   * `perform`: on a single shared tablet the term has to reach the performer
   * before it reaches the room.
   */
  beginTurn(difficulty: Difficulty): boolean {
    if (this._stage() !== 'board') return false;
    const mode = this.currentMode();
    if (mode === null) return false;

    const challenge = this.picker.pick(this.pool, mode, difficulty);
    if (!challenge) return false;

    this._perform.set(challenge);
    this._locate.set(null);
    this._picked.set(null);
    this._banked.set(0);
    this._outcome.set(null);
    this._skipUsed.set(false);
    this._stage.set('handoff');
    return true;
  }

  /** The performer has the tablet — show the card and start the clock. */
  reveal(): void {
    if (this._stage() !== 'handoff') return;
    this._stage.set('perform');
  }

  /** Swap the card once per Zug, keeping mode and difficulty. */
  skip(): boolean {
    if (this._stage() !== 'perform' || this._skipUsed()) return false;
    const current = this._perform();
    if (!current) return false;
    const next = this.picker.pick(this.pool, current.mode, current.difficulty);
    if (!next) return false;
    this._skipUsed.set(true);
    this._perform.set(next);
    return true;
  }

  /** The moderator calls Stufe 1. A miss ends the Zug with nothing banked. */
  resolvePerform(guessed: boolean): void {
    if (this._stage() !== 'perform') return;
    const challenge = this._perform();
    if (!challenge) return;

    if (!guessed) {
      this.finishTurn({ guessed: false, located: null, fetched: null });
      return;
    }

    this._banked.update((p) => p + this.config.points[challenge.difficulty]);

    if (this.config.stufen.locate) {
      this._locate.set(
        generateLocate({
          subject: challenge.subject,
          vehicleId: this.config.vehicleId,
          placements: this.placements,
          compartmentIds: this.compartmentIds,
        }),
      );
      this._stage.set('locate');
      return;
    }
    if (this.config.stufen.fetch) {
      this._stage.set('fetch');
      return;
    }
    this.finishTurn({ guessed: true, located: null, fetched: null });
  }

  /** Tap a Fach. Reveals the verdict in place; `continueFromLocate` moves on. */
  pickCompartment(compartmentId: CompartmentId): void {
    if (this._stage() !== 'locate' || this.locateRevealed()) return;
    this._picked.set(compartmentId);
    if (this.locateWasCorrect()) this._banked.update((p) => p + this.config.locateBonus);
  }

  /** Leave the Stufe 2 reveal: on to Stufe 3, or end the Zug. */
  continueFromLocate(): void {
    if (this._stage() !== 'locate' || !this.locateRevealed()) return;
    const located = this.locateWasCorrect();
    if (located && this.config.stufen.fetch) {
      this._stage.set('fetch');
      return;
    }
    this.finishTurn({ guessed: true, located, fetched: null });
  }

  /** The moderator calls Stufe 3 — did the item actually arrive, in time? */
  resolveFetch(fetched: boolean): void {
    if (this._stage() !== 'fetch') return;
    if (fetched) this._banked.update((p) => p + this.config.fetchBonus);
    const located = this.config.stufen.locate ? this.locateWasCorrect() : null;
    this.finishTurn({ guessed: true, located, fetched });
  }

  /** A clock ran out. Stufe 2 is untimed, so this only bites on 1 and 3. */
  expire(): void {
    if (this._stage() === 'perform') this.resolvePerform(false);
    else if (this._stage() === 'fetch') this.resolveFetch(false);
  }

  /** Hand over to the next team, or end the game. */
  nextTurn(): void {
    if (this._stage() !== 'result') return;
    this._perform.set(null);
    this._locate.set(null);
    this._picked.set(null);
    this._outcome.set(null);
    this._banked.set(0);

    if (this.isOver()) {
      this._stage.set('over');
      return;
    }
    const order = this._turnOrder();
    if (order.length > 0) this._turnIdx.set((this._turnIdx() + 1) % order.length);
    this._stage.set('board');
  }

  // ---- internals -----------------------------------------------------------

  private finishTurn(parts: Pick<TurnOutcome, 'guessed' | 'located' | 'fetched'>): void {
    const team = this.currentTeam();
    const challenge = this._perform();
    if (team === null || !challenge) return;

    const points = this._banked();
    const outcome: TurnOutcome = {
      team,
      subject: challenge.subject,
      mode: challenge.mode,
      difficulty: challenge.difficulty,
      ...parts,
      correctCompartments: this._locate()?.correct ?? [],
      pickedCompartment: this._picked(),
      points,
    };

    this._zuege.update((n) => n + 1);
    this._turnsByTeam.update((turns) => {
      const next = [...turns];
      next[team] = (next[team] ?? 0) + 1;
      return next;
    });
    this._outcome.set(outcome);
    this._log.update((log) => [...log, outcome]);
    if (points > 0) this.advanceTeam(team, points);
    this._stage.set('result');
  }

  /** Move a team forward, clamping at Ziel and recording the finish. */
  private advanceTeam(team: number, amount: number): void {
    const positions = [...this._positions()];
    positions[team] += amount;
    if (positions[team] >= this.goalIndex) {
      positions[team] = this.goalIndex;
      if (!this._finished().includes(team)) {
        this._finished.update((done) => [...done, team]);
        if (this.isSolo) this._soloResult.set({ crew: this.teams[team], zuege: this._zuege() });
      }
    }
    this._positions.set(positions);
  }
}
