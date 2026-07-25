import { describe, expect, it } from 'vitest';
import { PerformCandidate, PerformPicker, eligible, generatePerform } from './perform';
import { Equipment } from '../models/equipment';
import { ActivityCard } from '../models/activity-card';

const card = (id: string, difficulty: ActivityCard['difficulty'], extra: Partial<ActivityCard> = {}): PerformCandidate => ({
  card: { equipmentId: id, difficulty, ...extra },
  subject: { id, name: id } as Equipment,
});

const pool: PerformCandidate[] = [
  card('saege', 'Leicht', { taboo: ['Kette', 'Holz'] }),
  card('leine', 'Leicht'),
  card('tafel', 'Leicht', { excludeModes: ['Pantomime'] }),
  card('zumischer', 'Schwer'),
];

/** Deterministic selector: always the first option. */
const first = <T>(options: T[]): T => options[0];

describe('eligible', () => {
  it('filters by difficulty', () => {
    expect(eligible(pool, 'Beschreiben', 'Schwer').map((c) => c.card.equipmentId)).toEqual([
      'zumischer',
    ]);
  });

  it('drops cards that opt out of the mode', () => {
    expect(eligible(pool, 'Pantomime', 'Leicht').map((c) => c.card.equipmentId)).toEqual([
      'saege',
      'leine',
    ]);
    expect(eligible(pool, 'Zeichnen', 'Leicht').map((c) => c.card.equipmentId)).toContain('tafel');
  });
});

describe('generatePerform', () => {
  it('carries Tabu-Wörter only when the performer may speak', () => {
    expect(generatePerform(pool[0], 'Beschreiben').taboo).toEqual(['Kette', 'Holz']);
    expect(generatePerform(pool[0], 'Zeichnen').taboo).toEqual([]);
    expect(generatePerform(pool[0], 'Pantomime').taboo).toEqual([]);
  });

  it('takes the difficulty from the card, not the caller', () => {
    expect(generatePerform(pool[3], 'Zeichnen').difficulty).toBe('Schwer');
  });
});

describe('PerformPicker', () => {
  it('returns null when nothing matches', () => {
    expect(new PerformPicker(first).pick(pool, 'Beschreiben', 'Mittel')).toBeNull();
  });

  it('does not repeat within the recent window', () => {
    const picker = new PerformPicker(first, 5);
    expect(picker.pick(pool, 'Beschreiben', 'Leicht')?.subject.id).toBe('saege');
    expect(picker.pick(pool, 'Beschreiben', 'Leicht')?.subject.id).toBe('leine');
    expect(picker.pick(pool, 'Beschreiben', 'Leicht')?.subject.id).toBe('tafel');
  });

  it('falls back to the full set once everything is recent, rather than stalling', () => {
    const picker = new PerformPicker(first, 5);
    const single = [card('saege', 'Leicht')];
    expect(picker.pick(single, 'Beschreiben', 'Leicht')?.subject.id).toBe('saege');
    expect(picker.pick(single, 'Beschreiben', 'Leicht')?.subject.id).toBe('saege');
  });

  it('tracks recency across modes — a term seen as Pantomime is still recent', () => {
    const picker = new PerformPicker(first, 5);
    expect(picker.pick(pool, 'Pantomime', 'Leicht')?.subject.id).toBe('saege');
    expect(picker.pick(pool, 'Zeichnen', 'Leicht')?.subject.id).toBe('leine');
  });
});
