import { describe, expect, it } from 'vitest';
import { LF_VEHICLE_TYPE, SEED_EQUIPMENT, SEED_VEHICLE_TYPES } from './seed-lf';
import { LF_COMPARTMENT_IDS } from '../models/compartment';

describe('LF seed integrity', () => {
  const compartmentIds = new Set<string>(LF_COMPARTMENT_IDS);
  const equipmentIds = new Set(SEED_EQUIPMENT.map((e) => e.id));

  it('compartments match the LfSketch zone id set', () => {
    expect(new Set(LF_VEHICLE_TYPE.compartments.map((c) => c.id))).toEqual(compartmentIds);
  });

  it('every default placement targets a real compartment', () => {
    for (const p of LF_VEHICLE_TYPE.defaultLoadout) {
      expect(compartmentIds.has(p.compartmentId)).toBe(true);
    }
  });

  it('every default placement references a catalog equipment id', () => {
    for (const p of LF_VEHICLE_TYPE.defaultLoadout) {
      expect(equipmentIds.has(p.equipmentId)).toBe(true);
    }
  });

  it('has no duplicate equipment ids', () => {
    expect(equipmentIds.size).toBe(SEED_EQUIPMENT.length);
  });
});

describe('catalog type schematics', () => {
  // The UI gates Beladung/rounds on `compartments.length` — types with a layout
  // are drawn either by their hand-crafted sketch or by the generic metadata
  // renderer, so the layout data has to hold up on its own (ADR-0003).
  it('a type claiming a custom sketch also carries a compartment layout', () => {
    for (const t of SEED_VEHICLE_TYPES.filter((x) => x.hasCustomSketch)) {
      expect(t.compartments.length, t.id).toBeGreaterThan(0);
    }
  });

  it('a type with a compartment layout also carries a default loadout', () => {
    for (const t of SEED_VEHICLE_TYPES.filter((x) => x.compartments.length > 0)) {
      expect(t.defaultLoadout.length, t.id).toBeGreaterThan(0);
    }
  });

  it('orders compartments uniquely within a side', () => {
    // Two compartments sharing a side + order would land on the same grid cell.
    for (const t of SEED_VEHICLE_TYPES) {
      const seen = new Set<string>();
      for (const c of t.compartments) {
        const cell = `${c.side}/${c.order}`;
        expect(seen.has(cell), `${t.id}: ${cell} used twice`).toBe(false);
        seen.add(cell);
      }
    }
  });

  it('numbers the DIN Geräteräume front→rear along each flank', () => {
    // G1/G2 sit at the front, G5/G6 at the rear — a renderer laying a flank out
    // by `order` draws the truck backwards if the seed encodes CSV order instead.
    for (const t of SEED_VEHICLE_TYPES) {
      const flank = t.compartments.filter((c) => /^G\d+$/.test(c.id));
      for (const a of flank) {
        for (const b of flank) {
          if (a.side !== b.side || a === b) continue;
          const older = Number(a.id.slice(1)) < Number(b.id.slice(1));
          expect(older === a.order < b.order, `${t.id}: ${a.id} vs ${b.id}`).toBe(true);
        }
      }
    }
  });

  it('every default placement targets one of its own type compartments', () => {
    for (const t of SEED_VEHICLE_TYPES) {
      const own = new Set(t.compartments.map((c) => c.id));
      for (const p of t.defaultLoadout) {
        expect(own.has(p.compartmentId), `${t.id}/${p.compartmentId}`).toBe(true);
      }
    }
  });
});
