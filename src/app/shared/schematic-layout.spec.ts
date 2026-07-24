import { describe, expect, it } from 'vitest';
import { schematicLayout, SchematicZone } from './schematic-layout';
import { Compartment, Side } from '../core/models/compartment';
import { SEED_VEHICLE_TYPES } from '../core/seed/seed-lf';

const c = (id: string, side: Side, order: number): Compartment => ({ id, label: id, side, order });

/** Every grid cell a zone occupies, as "col,row" keys. */
const cells = (z: SchematicZone): string[] => {
  const out: string[] = [];
  for (let col = z.col; col < z.col + z.colSpan; col++) {
    for (let row = z.row; row < z.row + z.rowSpan; row++) out.push(`${col},${row}`);
  }
  return out;
};

const zone = (zones: SchematicZone[], id: string): SchematicZone => zones.find((z) => z.id === id)!;

describe('schematicLayout', () => {
  it('runs each flank front→rear down its own column', () => {
    const { zones, cols } = schematicLayout([
      c('Mannschaftsraum', 'cabin', 1),
      c('G1', 'left', 1),
      c('G3', 'left', 2),
      c('G5', 'left', 3),
      c('G2', 'right', 1),
      c('G4', 'right', 2),
      c('G6', 'right', 3),
      c('Dach', 'roof', 1),
    ]);

    expect(cols).toBe(3);
    // Cabin bands across the front, above both flanks.
    expect(zone(zones, 'Mannschaftsraum')).toMatchObject({ col: 1, colSpan: 3, row: 1 });
    expect(zone(zones, 'G1').col).toBe(1);
    expect(zone(zones, 'G2').col).toBe(3);
    expect(zone(zones, 'Dach')).toMatchObject({ col: 2, row: 2, rowSpan: 3 });
    // Front→rear: G1 above G3 above G5, and the same to starboard.
    expect(zone(zones, 'G1').row).toBeLessThan(zone(zones, 'G3').row);
    expect(zone(zones, 'G3').row).toBeLessThan(zone(zones, 'G5').row);
    expect(zone(zones, 'G2').row).toBeLessThan(zone(zones, 'G4').row);
  });

  it('lines up flanks of unequal length', () => {
    const { zones, rows } = schematicLayout([
      c('G1', 'left', 1),
      c('G3', 'left', 2),
      c('G5', 'left', 3),
      c('G2', 'right', 1),
      c('Dach', 'roof', 1),
    ]);

    expect(rows).toBe(3);
    // The lone right-hand Fach stretches over the full body rather than leaving a gap.
    expect(zone(zones, 'G2')).toMatchObject({ row: 1, rowSpan: 3 });
    expect(zone(zones, 'Dach')).toMatchObject({ row: 1, rowSpan: 3 });
  });

  it('drops the centre column when a type has no roof compartment', () => {
    const { zones, cols } = schematicLayout([c('G1', 'left', 1), c('G2', 'right', 1)]);

    expect(cols).toBe(2);
    expect(zone(zones, 'G2').col).toBe(2);
  });

  it('stacks everything full-width when a type has no flanks', () => {
    const { zones, cols, rows } = schematicLayout([
      c('Fahrersitz', 'cabin', 1),
      c('Sitzbank', 'cabin', 2),
      c('Dach', 'roof', 1),
    ]);

    expect(cols).toBe(1);
    expect(rows).toBe(3);
    expect(zones.map((z) => z.id)).toEqual(['Fahrersitz', 'Sitzbank', 'Dach']);
    expect(zones.every((z) => z.col === 1 && z.colSpan === 1)).toBe(true);
  });

  it('bands rear compartments across the back', () => {
    const { zones, rows } = schematicLayout([
      c('G1', 'left', 1),
      c('G2', 'right', 1),
      c('Heck', 'rear', 1),
    ]);

    expect(rows).toBe(2);
    expect(zone(zones, 'Heck')).toMatchObject({ row: 2, col: 1, colSpan: 2 });
  });

  it('has an empty layout for a catalog stub', () => {
    expect(schematicLayout([])).toMatchObject({ zones: [], rows: 0 });
  });

  it('never overlaps two zones, for any seeded type', () => {
    for (const t of SEED_VEHICLE_TYPES) {
      const taken = new Set<string>();
      for (const z of schematicLayout(t.compartments).zones) {
        for (const cell of cells(z)) {
          expect(taken.has(cell), `${t.id}: ${z.id} collides at ${cell}`).toBe(false);
          taken.add(cell);
        }
      }
    }
  });

  it('places every compartment of every seeded type', () => {
    for (const t of SEED_VEHICLE_TYPES) {
      const { zones } = schematicLayout(t.compartments);
      expect(zones.length, t.id).toBe(t.compartments.length);
      expect(zones.every((z) => z.rowSpan >= 1 && z.colSpan >= 1), t.id).toBe(true);
    }
  });
});
