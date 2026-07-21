import { describe, expect, it } from 'vitest';
import { LF_VEHICLE_TYPE, SEED_EQUIPMENT } from './seed-lf';
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
