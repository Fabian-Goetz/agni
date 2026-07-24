import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleSchematic } from '../../shared/vehicle-schematic';
import { InPersonSessionStore } from '../../core/session/inperson-session.store';
import { LibraryService } from '../../core/library/library.service';
import { CompartmentId } from '../../core/models/compartment';
import { HlmButton } from '../../shared/ui/hlm-button.directive';

/** In-Person Locate round: show an item, tap its compartment, reveal, repeat. */
@Component({
  selector: 'fk-play',
  imports: [VehicleSchematic, HlmButton],
  templateUrl: './play.html',
  styleUrl: './play.scss',
})
export class Play {
  readonly session = inject(InPersonSessionStore);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);

  readonly correctLabel = computed(() => this.session.current()?.correct.join(', ') ?? '');

  /** The Vehicle Type under drill — decides which schematic is drawn (ADR-0003). */
  readonly vehicleType = computed(() => {
    const id = this.session.config()?.vehicleId;
    const vehicle = id ? this.library.vehicleById(id) : undefined;
    return vehicle ? this.library.typeById(vehicle.typeId) : undefined;
  });

  constructor() {
    // If the session was never started (e.g. deep link/refresh), bounce to select.
    effect(() => {
      if (this.session.current() === null && this.session.asked() === 0 && !this.session.finished()) {
        this.router.navigate(['/select'], { replaceUrl: true });
      }
    });
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
}
