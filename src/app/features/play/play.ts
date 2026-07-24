import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LfSketch } from '../../shared/lf-sketch';
import { InPersonSessionStore } from '../../core/session/inperson-session.store';
import { CompartmentId } from '../../core/models/compartment';
import { HlmButton } from '../../shared/ui/hlm-button.directive';

/** In-Person Locate round: show an item, tap its compartment, reveal, repeat. */
@Component({
  selector: 'fk-play',
  imports: [LfSketch, HlmButton],
  templateUrl: './play.html',
  styleUrl: './play.scss',
})
export class Play {
  readonly session = inject(InPersonSessionStore);
  private readonly router = inject(Router);

  readonly correctLabel = computed(() => this.session.current()?.correct.join(', ') ?? '');

  constructor() {
    // If the session was never started (e.g. deep link/refresh), bounce to select.
    effect(() => {
      if (this.session.current() === null && this.session.asked() === 0) {
        this.router.navigate(['/select'], { replaceUrl: true });
      }
    });
  }

  pick(c: CompartmentId): void {
    this.session.pick(c);
  }

  quit(): void {
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
