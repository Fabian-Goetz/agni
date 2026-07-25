import { Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleSchematic } from '../../shared/vehicle-schematic';
import { InPersonSessionStore } from '../../core/session/inperson-session.store';
import { LibraryService } from '../../core/library/library.service';
import { CompartmentId } from '../../core/models/compartment';
import { GAMES } from '../../core/session/round-config';

/**
 * In-Person Locate round: show an item, tap its compartment, reveal, repeat.
 *
 * The one screen a trainee looks at, so it runs on **round chrome** rather than
 * the authoring shell (design-guidelines §6): no brand topbar, no footer — a slim
 * sticky bar with the exit, the progress rail and the tally, then the prompt and
 * the schematic. Everything that isn't the current question stays quiet.
 */
@Component({
  selector: 'fk-play',
  imports: [VehicleSchematic],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './play.html',
  styleUrl: './play.scss',
})
export class Play {
  readonly session = inject(InPersonSessionStore);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);

  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  /** Which game framed this round — named in the round bar. */
  readonly game = computed(() => {
    const id = this.session.config()?.game;
    return id ? GAMES[id] : undefined;
  });

  readonly vehicle = computed(() => {
    const id = this.session.config()?.vehicleId;
    return id ? this.library.vehicleById(id) : undefined;
  });

  /** The Vehicle Type under drill — decides which schematic is drawn (ADR-0003). */
  readonly vehicleType = computed(() => {
    const vehicle = this.vehicle();
    return vehicle ? this.library.typeById(vehicle.typeId) : undefined;
  });

  private readonly compartments = computed(() => {
    const id = this.session.config()?.vehicleId;
    return id ? this.library.compartmentsForVehicle(id) : [];
  });

  /** Where the current item actually belongs, spelled out for the reveal. */
  readonly correctLabel = computed(() => this.labelsFor(this.session.current()?.correct ?? []));

  /** Progress rail width; the round bar reads "Frage n/total" beside it. */
  readonly progressPct = computed(() => {
    const total = this.session.total();
    return total === 0 ? 0 : Math.round((this.session.asked() / total) * 100);
  });

  readonly quotaPct = computed(() => {
    const total = this.session.total();
    return total === 0 ? 0 : Math.round((this.session.correctCount() / total) * 100);
  });

  /**
   * A round over a vehicle with nothing verlastet. `start()` deals from an empty
   * queue and lands straight in `finished`, so this has to be checked *before*
   * the summary — otherwise an unloaded vehicle reports "0 / 0, alles getroffen".
   */
  readonly nothingToDrill = computed(
    () => this.session.config() !== null && this.session.total() === 0,
  );

  /** End summary: the misses, each with the Fach it should have been. */
  readonly review = computed(() =>
    this.session.missed().map((a) => ({
      name: a.subject.name,
      where: this.labelsFor(a.correct),
      picked: this.compartmentLabel(a.picked),
    })),
  );

  constructor() {
    // If the session was never started (e.g. deep link/refresh), bounce to select.
    effect(() => {
      if (this.session.current() === null && this.session.asked() === 0 && !this.session.finished()) {
        this.router.navigate(['/select'], { replaceUrl: true });
      }
    });
  }

  compartmentLabel(id: CompartmentId): string {
    return this.compartments().find((c) => c.id === id)?.label ?? id;
  }

  private labelsFor(ids: CompartmentId[]): string {
    return ids.map((id) => this.compartmentLabel(id)).join(' · ');
  }

  pick(c: CompartmentId): void {
    this.session.pick(c);
  }

  again(): void {
    this.session.restart();
  }

  quit(): void {
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
