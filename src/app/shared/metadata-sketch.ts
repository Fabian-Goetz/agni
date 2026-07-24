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
  /** Editor: the Fach currently being worked — amber outline. */
  readonly selected = input<CompartmentId[]>([]);
  /** Editor: Fächer that carry the active Gerät — green fill ("it lives here"). */
  readonly marked = input<CompartmentId[]>([]);
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
    const open = this.selected().includes(c);
    const carries = this.marked().includes(c);
    if (open && carries) return `${BASE} border-warn bg-go text-ink`;
    if (open) return `${BASE} border-warn bg-warn/15 text-foreground`;
    if (carries) return `${BASE} border-go bg-go/25 text-foreground`;
    return `${BASE} border-edge bg-input text-foreground hover:border-muted-foreground`;
  }
}
