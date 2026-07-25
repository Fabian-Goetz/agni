import { describe, expect, it } from 'vitest';
import { ActivityGame, ActivityGameDeps } from './activity-game';
import { ActivityConfig, DEFAULT_ACTIVITY_CONFIG } from './activity-config';
import { BoardCell } from './board';
import { PerformCandidate, PerformPicker } from '../challenge/perform';
import { Equipment } from '../models/equipment';
import { Placement } from '../models/vehicle';

/** All-Beschreiben board so a test never has to care which cell it landed on. */
const board = (length: number): BoardCell[] => [
  ...Array<BoardCell>(length - 1).fill('Beschreiben'),
  'Ziel',
];

const subject = (id: string): Equipment => ({ id, name: id });

const pool: PerformCandidate[] = [
  { card: { equipmentId: 'saege', difficulty: 'Leicht' }, subject: subject('saege') },
  { card: { equipmentId: 'leine', difficulty: 'Leicht' }, subject: subject('leine') },
  { card: { equipmentId: 'zumischer', difficulty: 'Schwer' }, subject: subject('zumischer') },
];

const placements: Placement[] = [
  { vehicleId: 'v1', compartmentId: 'G1', equipmentId: 'saege' },
  { vehicleId: 'v1', compartmentId: 'G2', equipmentId: 'leine' },
  { vehicleId: 'v1', compartmentId: 'G3', equipmentId: 'zumischer' },
];

function game(overrides: Partial<ActivityConfig> = {}, deps: Partial<ActivityGameDeps> = {}) {
  const config: ActivityConfig = {
    vehicleId: 'v1',
    teams: ['Rot', 'Blau'],
    ...DEFAULT_ACTIVITY_CONFIG,
    ...overrides,
  };
  return new ActivityGame({
    config,
    board: board(36),
    pool,
    placements,
    compartmentIds: ['G1', 'G2', 'G3', 'G4'],
    // First option every time, so the drawn card is predictable.
    picker: new PerformPicker((options) => options[0]),
    shuffle: (order) => order,
    ...deps,
  });
}

/** Drive a Zug to the point where Stufe 1 has been called. */
function toPerform(g: ActivityGame, difficulty: 'Leicht' | 'Mittel' | 'Schwer' = 'Leicht') {
  g.beginTurn(difficulty);
  g.reveal();
  return g;
}

describe('ActivityGame — setup', () => {
  it('starts every team at field 0, on the board stage', () => {
    const g = game();
    expect(g.positions()).toEqual([0, 0]);
    expect(g.stage()).toBe('board');
    expect(g.currentTeam()).toBe(0);
  });

  it('reports one team as solo', () => {
    expect(game({ teams: ['Allein'] }).isSolo).toBe(true);
    expect(game().isSolo).toBe(false);
  });

  it('reports how many cards back each difficulty gamble', () => {
    const g = game();
    expect(g.available('Leicht')).toBe(2);
    expect(g.available('Mittel')).toBe(0);
    expect(g.available('Schwer')).toBe(1);
  });
});

describe('ActivityGame — the handoff', () => {
  it('lands on handoff, not perform: the term reaches the performer first', () => {
    const g = game();
    expect(g.beginTurn('Leicht')).toBe(true);
    expect(g.stage()).toBe('handoff');
    expect(g.perform()?.subject.id).toBe('saege');
  });

  it('refuses a difficulty the pool cannot serve', () => {
    const g = game();
    expect(g.beginTurn('Mittel')).toBe(false);
    expect(g.stage()).toBe('board');
  });

  it('allows exactly one skip per Zug', () => {
    const g = toPerform(game());
    expect(g.skip()).toBe(true);
    expect(g.perform()?.subject.id).toBe('leine');
    expect(g.skip()).toBe(false);
  });
});

describe('ActivityGame — the Stufen chain', () => {
  it('a missed guess ends the Zug with nothing banked', () => {
    const g = toPerform(game());
    g.resolvePerform(false);
    expect(g.stage()).toBe('result');
    expect(g.outcome()).toMatchObject({ guessed: false, located: null, points: 0 });
    expect(g.positions()).toEqual([0, 0]);
  });

  it('a correct guess banks the difficulty points and opens Stufe 2', () => {
    const g = toPerform(game());
    g.resolvePerform(true);
    expect(g.stage()).toBe('locate');
    expect(g.banked()).toBe(2);
    expect(g.locate()?.correct).toEqual(['G1']);
  });

  it('skips straight to the result when both extra Stufen are off', () => {
    const g = toPerform(game({ stufen: { locate: false, fetch: false } }));
    g.resolvePerform(true);
    expect(g.stage()).toBe('result');
    expect(g.outcome()?.points).toBe(2);
  });

  it('skips Stufe 2 and goes to Stufe 3 when only fetch is on', () => {
    const g = toPerform(game({ stufen: { locate: false, fetch: true } }));
    g.resolvePerform(true);
    expect(g.stage()).toBe('fetch');
  });

  it('reveals the Stufe 2 verdict in place before moving on', () => {
    const g = toPerform(game());
    g.resolvePerform(true);
    g.pickCompartment('G1');
    expect(g.stage()).toBe('locate');
    expect(g.locateRevealed()).toBe(true);
    expect(g.locateWasCorrect()).toBe(true);
    expect(g.banked()).toBe(4); // 2 + locateBonus
  });

  it('ignores a second tap once the verdict is up', () => {
    const g = toPerform(game());
    g.resolvePerform(true);
    g.pickCompartment('G4');
    g.pickCompartment('G1');
    expect(g.picked()).toBe('G4');
    expect(g.banked()).toBe(2);
  });

  it('keeps the guess points when Stufe 2 is missed — strict chain, not all-or-nothing', () => {
    const g = toPerform(game());
    g.resolvePerform(true);
    g.pickCompartment('G4');
    g.continueFromLocate();
    expect(g.stage()).toBe('result');
    expect(g.outcome()).toMatchObject({ guessed: true, located: false, fetched: null, points: 2 });
    expect(g.positions()[0]).toBe(2);
  });

  it('a missed Stufe 2 ends the Zug even when Stufe 3 is enabled', () => {
    const g = toPerform(game({ stufen: { locate: true, fetch: true } }));
    g.resolvePerform(true);
    g.pickCompartment('G4');
    g.continueFromLocate();
    expect(g.stage()).toBe('result');
  });

  it('runs all three Stufen and sums the points', () => {
    const g = toPerform(game({ stufen: { locate: true, fetch: true } }));
    g.resolvePerform(true);
    g.pickCompartment('G1');
    g.continueFromLocate();
    expect(g.stage()).toBe('fetch');
    g.resolveFetch(true);
    expect(g.outcome()).toMatchObject({ guessed: true, located: true, fetched: true, points: 7 });
  });

  it('names the correct Fach in the outcome even on a miss — the teaching survives', () => {
    const g = toPerform(game());
    g.resolvePerform(true);
    g.pickCompartment('G4');
    g.continueFromLocate();
    expect(g.outcome()?.correctCompartments).toEqual(['G1']);
    expect(g.outcome()?.pickedCompartment).toBe('G4');
  });
});

describe('ActivityGame — expiry', () => {
  it('a Stufe 1 timeout counts as a missed guess', () => {
    const g = toPerform(game());
    g.expire();
    expect(g.outcome()).toMatchObject({ guessed: false, points: 0 });
  });

  it('a Stufe 3 timeout keeps what was already banked', () => {
    const g = toPerform(game({ stufen: { locate: true, fetch: true } }));
    g.resolvePerform(true);
    g.pickCompartment('G1');
    g.continueFromLocate();
    g.expire();
    expect(g.outcome()).toMatchObject({ fetched: false, points: 4 });
  });

  it('does nothing during the untimed Stufe 2', () => {
    const g = toPerform(game());
    g.resolvePerform(true);
    g.expire();
    expect(g.stage()).toBe('locate');
  });
});

describe('ActivityGame — turns and the board', () => {
  it('alternates teams and counts Züge', () => {
    const g = game();
    toPerform(g).resolvePerform(false);
    g.nextTurn();
    expect(g.currentTeam()).toBe(1);
    toPerform(g).resolvePerform(false);
    g.nextTurn();
    expect(g.currentTeam()).toBe(0);
    expect(g.zuege()).toBe(2);
    expect(g.turnsByTeam()).toEqual([1, 1]);
  });

  it('the board cell decides the performance mode', () => {
    const cells: BoardCell[] = ['Zeichnen', 'Pantomime', 'Beschreiben', 'Ziel'];
    const g = game({}, { board: cells });
    expect(g.currentMode()).toBe('Zeichnen');
  });

  it('nextTurn is inert outside the result stage', () => {
    const g = toPerform(game());
    g.nextTurn();
    expect(g.stage()).toBe('perform');
  });

  it('logs every finished Zug in order', () => {
    const g = game();
    toPerform(g).resolvePerform(false);
    g.nextTurn();
    toPerform(g).resolvePerform(true);
    // The recency window deals a different card, so ask the challenge itself.
    g.pickCompartment(g.locate()!.correct[0]);
    g.continueFromLocate();
    expect(g.log().map((o) => o.points)).toEqual([0, 4]);
    expect(g.log().map((o) => o.team)).toEqual([0, 1]);
  });
});

describe('ActivityGame — winning', () => {
  it('clamps at Ziel and ends the game on the first finisher', () => {
    // 3-cell board: the goal is index 2, so one clean Leicht Zug (2 pts) wins.
    const g = game({}, { board: board(3) });
    toPerform(g).resolvePerform(true);
    g.pickCompartment('G1');
    g.continueFromLocate();
    expect(g.positions()[0]).toBe(2);
    expect(g.finished()).toEqual([0]);
    expect(g.isOver()).toBe(true);
    g.nextTurn();
    expect(g.stage()).toBe('over');
  });

  it('records a solo result in Zügen bis Ziel', () => {
    const g = game({ teams: ['Allein'] }, { board: board(3) });
    toPerform(g).resolvePerform(false);
    g.nextTurn();
    toPerform(g).resolvePerform(true);
    g.pickCompartment('G1');
    g.continueFromLocate();
    expect(g.soloResult()).toEqual({ crew: 'Allein', zuege: 2 });
  });

  it('leaves no solo result while the crew is short of Ziel', () => {
    const g = game({ teams: ['Allein'] });
    toPerform(g).resolvePerform(true);
    g.pickCompartment('G1');
    g.continueFromLocate();
    expect(g.soloResult()).toBeNull();
    expect(g.isOver()).toBe(false);
  });
});
