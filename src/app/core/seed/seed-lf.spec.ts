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
  // The UI gates Beladung/rounds on `hasCustomSketch && compartments.length` —
  // a type claiming a sketch without a layout (or vice versa) would render the
  // LF's zones for the wrong truck (ADR-0003).
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

  it('every default placement targets one of its own type compartments', () => {
    for (const t of SEED_VEHICLE_TYPES) {
      const own = new Set(t.compartments.map((c) => c.id));
      for (const p of t.defaultLoadout) {
        expect(own.has(p.compartmentId), `${t.id}/${p.compartmentId}`).toBe(true);
      }
    }
  });
});
