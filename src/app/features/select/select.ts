import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../core/library/library.service';
import { InPersonSessionStore } from '../../core/session/inperson-session.store';
import { Vehicle } from '../../core/models/vehicle';

/** Choose which Vehicle to drill, then start an In-Person session. */
@Component({
  selector: 'fk-select',
  imports: [RouterLink],
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select {
  readonly library = inject(LibraryService);
  private readonly session = inject(InPersonSessionStore);
  private readonly router = inject(Router);

  readonly starting = signal(false);

  constructor() {
    this.library.ensureStarterVehicle();
  }

  play(v: Vehicle): void {
    this.session.start(v.id);
    this.router.navigate(['/play'], { replaceUrl: true });
  }
}
