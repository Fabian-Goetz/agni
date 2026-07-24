import { Component, computed, input, output } from '@angular/core';
import { Compartment, CompartmentId } from '../core/models/compartment';
import { schematicLayout } from './schematic-layout';

const BASE =
  'flex min-h-11 items-center justify-center rounded-md border px-1 text-center text-xs font-bold leading-tight transition-colors disabled:cursor-default';

/**
 * Top-down schematic drawn from compartment metadata alone — the zero-artwork
 * renderer of ADR-0003, for every Vehicle Type without a hand-crafted sketch.
 * Zones are real buttons, so the schematic is keyboard-operable (ADR-0005).
 *
 * Shares the picked/correct/revealed/selected + (pick) contract with LfSketch;
 * pick one via `fk-vehicle-schematic` rather than reaching for either directly.
 */
@Component({
  selector: 'fk-metadata-sketch',
  templateUrl: './metadata-sketch.html',
  styleUrl: './metadata-sketch.scss',
})
export class MetadataSketch {
  readonly compartments = input<Compartment[]>([]);
  readonly picked = input<CompartmentId | null>(null);
  readonly correct = input<CompartmentId[]>([]);
  readonly revealed = input(false);
  /** Editor mode: highlight these Fächer as chosen (tapping toggles via (pick)). */
  readonly selected = input<CompartmentId[]>([]);
  readonly pick = output<CompartmentId>();

  readonly layout = computed(() => schematicLayout(this.compartments()));

  tap(c: CompartmentId): void {
    if (!this.revealed()) this.pick.emit(c);
  }

  zoneClass(c: CompartmentId): string {
    if (this.revealed()) {
      if (this.correct().includes(c)) return `${BASE} border-white bg-go text-ink`;
      if (c === this.picked()) return `${BASE} border-white bg-destructive text-white`;
      return `${BASE} border-edge bg-input text-subtle`;
    }
    return this.selected().includes(c)
      ? `${BASE} border-white bg-go text-ink`
      : `${BASE} border-edge bg-input text-foreground hover:border-muted-foreground`;
  }
}
