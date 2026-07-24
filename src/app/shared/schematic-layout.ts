import { Compartment, CompartmentId, Side } from '../core/models/compartment';

/** A compartment placed on the schematic grid (1-based, CSS-grid coordinates). */
export interface SchematicZone {
  id: CompartmentId;
  label: string;
  side: Side;
  col: number;
  colSpan: number;
  row: number;
  rowSpan: number;
}

export interface SchematicLayout {
  zones: SchematicZone[];
  /** Grid track counts, for the container's `grid-template-*`. */
  cols: number;
  rows: number;
}

/**
 * Spread `items` over `rows` grid rows, as evenly as the division allows —
 * leftovers go to the first items, so a 3-item column in 4 rows reads 2/1/1.
 */
function distribute<T>(items: T[], rows: number): { item: T; row: number; rowSpan: number }[] {
  if (items.length === 0) return [];
  const base = Math.floor(rows / items.length);
  const extra = rows % items.length;
  let row = 1;
  return items.map((item, i) => {
    const rowSpan = base + (i < extra ? 1 : 0);
    const placed = { item, row, rowSpan };
    row += rowSpan;
    return placed;
  });
}

const bySide = (all: Compartment[], side: Side): Compartment[] =>
  all.filter((c) => c.side === side).sort((a, b) => a.order - b.order);

/**
 * Turn a Vehicle Type's compartment metadata into a top-down grid of tappable
 * zones — the zero-artwork renderer path of ADR-0003, used for every type that
 * has no hand-crafted sketch.
 *
 * Front is at the top: cabin compartments band across the front, `left` and
 * `right` run down the flanks front→rear (by `order`), `roof` fills the centre
 * between them, and `rear` bands across the back. Each flank column splits the
 * body rows among its own compartments, so sides of unequal length still line up.
 */
export function schematicLayout(compartments: Compartment[]): SchematicLayout {
  const cabin = bySide(compartments, 'cabin');
  const rear = bySide(compartments, 'rear');
  const left = bySide(compartments, 'left');
  const right = bySide(compartments, 'right');
  const roof = bySide(compartments, 'roof');

  // Without flanks there is no truck outline to speak of — stack everything
  // full-width (MTF seats, DLK Leiterpark/Korb, …) rather than fake a body.
  const flanked = left.length > 0 || right.length > 0;
  const cols = flanked ? (roof.length > 0 ? 3 : 2) : 1;
  const bodyRows = flanked ? Math.max(left.length, right.length, roof.length) : roof.length;

  const zones: SchematicZone[] = [];
  const band = (list: Compartment[], from: number): number => {
    list.forEach((c, i) => {
      zones.push({ ...c, col: 1, colSpan: cols, row: from + i, rowSpan: 1 });
    });
    return from + list.length;
  };

  const bodyStart = band(cabin, 1);

  if (flanked) {
    const column = (list: Compartment[], col: number) => {
      for (const { item, row, rowSpan } of distribute(list, bodyRows)) {
        zones.push({ ...item, col, colSpan: 1, row: bodyStart + row - 1, rowSpan });
      }
    };
    column(left, 1);
    if (roof.length > 0) column(roof, 2);
    column(right, cols);
  } else {
    band(roof, bodyStart);
  }

  const rows = bodyStart - 1 + bodyRows + rear.length;
  band(rear, bodyStart + bodyRows);

  return { zones, cols, rows };
}
