import { describe, expect, it } from 'vitest';
import { LocatePicker } from './locate-picker';
import { Equipment } from '../models/equipment';

const items: Equipment[] = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
];

describe('LocatePicker', () => {
  it('returns null for empty candidates', () => {
    const picker = new LocatePicker(() => items[0]);
    expect(picker.pick([])).toBeNull();
  });

  it('uses the injected selector deterministically', () => {
    const picker = new LocatePicker((opts) => opts[0]);
    expect(picker.pick(items)?.id).toBe('a');
  });

  it('avoids recently-picked items until the pool is exhausted', () => {
    // selector always takes the first eligible option
    const picker = new LocatePicker((opts) => opts[0], 5);
    const first = picker.pick(items)?.id; // 'a'
    const second = picker.pick(items)?.id; // 'a' filtered out -> 'b'
    const third = picker.pick(items)?.id; // 'a','b' filtered -> 'c'
    expect([first, second, third]).toEqual(['a', 'b', 'c']);
  });

  it('falls back to all items once every item is in the recent window', () => {
    const picker = new LocatePicker((opts) => opts[0], 5);
    picker.pick(items); // a
    picker.pick(items); // b
    picker.pick(items); // c
    // all three recent now -> options fall back to full list -> 'a'
    expect(picker.pick(items)?.id).toBe('a');
  });
});
