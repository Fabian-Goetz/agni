import { describe, expect, it } from 'vitest';
import { generateLocate, isCorrect } from './challenge';
import { Equipment } from '../models/equipment';
import { Placement } from '../models/vehicle';

const saw: Equipment = { id: 'saw', name: 'Motorsäge' };
const compartmentIds = ['G1', 'G2', 'G3', 'G4'] as const;

const placements: Placement[] = [
  { vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'saw' },
  { vehicleId: 'v1', compartmentId: 'Dach', equipmentId: 'saw' },
  { vehicleId: 'v1', compartmentId: 'G1', equipmentId: 'other' },
];

describe('generateLocate', () => {
  it('collects the correct compartments for the subject only', () => {
    const c = generateLocate({ subject: saw, vehicleId: 'v1', placements, compartmentIds: [...compartmentIds] });
    expect(c.correct.sort()).toEqual(['Dach', 'G4']);
  });

  it('exposes the vehicle compartments as candidates', () => {
    const c = generateLocate({ subject: saw, vehicleId: 'v1', placements, compartmentIds: [...compartmentIds] });
    expect(c.candidates).toEqual([...compartmentIds]);
  });

  it('deduplicates repeated correct compartments', () => {
    const dup: Placement[] = [
      { vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'saw' },
      { vehicleId: 'v1', compartmentId: 'G4', equipmentId: 'saw' },
    ];
    const c = generateLocate({ subject: saw, vehicleId: 'v1', placements: dup, compartmentIds: [...compartmentIds] });
    expect(c.correct).toEqual(['G4']);
  });

  it('isCorrect matches only the correct compartments', () => {
    const c = generateLocate({ subject: saw, vehicleId: 'v1', placements, compartmentIds: [...compartmentIds] });
    expect(isCorrect(c, 'G4')).toBe(true);
    expect(isCorrect(c, 'Dach')).toBe(true);
    expect(isCorrect(c, 'G2')).toBe(false);
  });
});
