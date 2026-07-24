import { Component, computed, input, output } from '@angular/core';
import { CompartmentId } from '../core/models/compartment';
import { VehicleType } from '../core/models/vehicle-type';
import { LfSketch } from './lf-sketch';
import { MetadataSketch } from './metadata-sketch';

/**
 * The one schematic a screen ever embeds. Picks the Vehicle Type's renderer —
 * hand-crafted SVG where one exists, generated metadata boxes otherwise — behind
 * a single set of zone ids (ADR-0003). Callers stay blind to which one drew it.
 */
@Component({
  selector: 'fk-vehicle-schematic',
  imports: [LfSketch, MetadataSketch],
  templateUrl: './vehicle-schematic.html',
  styleUrl: './vehicle-schematic.scss',
})
export class VehicleSchematic {
  readonly type = input<VehicleType | undefined>(undefined);
  readonly picked = input<CompartmentId | null>(null);
  readonly correct = input<CompartmentId[]>([]);
  readonly revealed = input(false);
  /** Editor mode: highlight these Fächer as chosen (tapping toggles via (pick)). */
  readonly selected = input<CompartmentId[]>([]);
  readonly pick = output<CompartmentId>();

  readonly custom = computed(() => !!this.type()?.hasCustomSketch);
  readonly compartments = computed(() => this.type()?.compartments ?? []);
}
