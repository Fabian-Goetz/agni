import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../core/library/library.service';
import { InPersonSessionStore } from '../../core/session/inperson-session.store';
import { Vehicle } from '../../core/models/vehicle';

/** Choose which Vehicle to drill, then start an In-Person session. */
@Component({
  selector: 'fk-select',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-full max-w-lg flex-col gap-5 px-5 py-8">
      <header class="flex items-center justify-between">
        <a routerLink="/home" class="text-sm text-muted-foreground">← Zurück</a>
        <h1 class="text-lg font-bold">Fahrzeug wählen</h1>
        <span class="w-12"></span>
      </header>

      @if (!library.loaded()) {
        <p class="text-center text-muted-foreground">Lädt…</p>
      } @else {
        <ul class="flex flex-col gap-3">
          @for (v of library.vehicles(); track v.id) {
            <li>
              <button
                type="button"
                class="w-full rounded-lg border border-border bg-card px-5 py-4 text-left active:scale-[0.99]"
                (click)="play(v)"
              >
                <span class="block text-lg font-semibold">{{ v.name }}</span>
                <span class="text-sm text-muted-foreground">
                  {{ library.placedEquipment(v.id).length }} Gegenstände
                </span>
              </button>
            </li>
          } @empty {
            <li class="text-center text-muted-foreground">Noch keine Fahrzeuge.</li>
          }
        </ul>
      }
    </main>
  `,
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
