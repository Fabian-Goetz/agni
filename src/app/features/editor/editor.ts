import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LfSketch } from '../../shared/lf-sketch';
import { LibraryService } from '../../core/library/library.service';
import { CompartmentId } from '../../core/models/compartment';
import { HlmButton } from '../../shared/ui/hlm-button.directive';
import { HlmCard } from '../../shared/ui/hlm-card.directive';

/**
 * Author content-editor. Pick a vehicle, click a compartment on the schematic,
 * tick which equipment lives there. Persists through the ContentStore.
 * (By-compartment direction; equipment can sit in several compartments.)
 */
@Component({
  selector: 'fk-editor',
  imports: [LfSketch, FormsModule, RouterLink, HlmButton, HlmCard],
  template: `
    <main class="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-5">
      <header class="flex items-center justify-between">
        <a routerLink="/home" class="text-sm text-muted-foreground">← Zurück</a>
        <h1 class="text-lg font-bold">Beladung bearbeiten</h1>
        <span class="w-12"></span>
      </header>

      @if (!library.loaded()) {
        <p class="text-center text-muted-foreground">Lädt…</p>
      } @else {
        @if (library.vehicles().length > 1) {
          <select
            class="rounded-md border border-border bg-input px-3 py-2 text-sm"
            [ngModel]="vehicleId()"
            (ngModelChange)="selectVehicle($event)"
          >
            @for (v of library.vehicles(); track v.id) {
              <option [value]="v.id">{{ v.name }}</option>
            }
          </select>
        }

        <fk-lf-sketch
          [selected]="open() ? [open()!] : []"
          (pick)="openCompartment($event)"
        />

        @if (open(); as fach) {
          <section hlmCard class="px-4 py-3">
            <div class="mb-2 flex items-center justify-between">
              <h2 class="font-bold text-primary">{{ fach }}</h2>
              <span class="text-xs text-muted-foreground">{{ countIn(fach) }} verlastet</span>
            </div>

            <ul class="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
              @for (e of library.equipmentSorted(); track e.id) {
                <li>
                  <label class="flex items-center gap-2 rounded px-1 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      class="size-4 accent-[var(--primary)]"
                      [checked]="library.hasPlacement(vehicleId()!, fach, e.id)"
                      (change)="toggle(fach, e.id)"
                    />
                    <span>{{ e.name }}</span>
                    @if (e.category) {
                      <span class="ml-auto text-xs text-muted-foreground">{{ e.category }}</span>
                    }
                  </label>
                </li>
              }
            </ul>

            <div class="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Neuer Gegenstand…"
                class="min-w-0 flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
                [(ngModel)]="newName"
                (keydown.enter)="addAndPlace(fach)"
              />
              <button hlmBtn size="sm" [disabled]="!newName().trim()" (click)="addAndPlace(fach)">
                + Hinzu
              </button>
            </div>
          </section>
        } @else {
          <p class="text-center text-sm text-muted-foreground">
            Fach antippen, um seine Beladung zu bearbeiten.
          </p>
        }
      }
    </main>
  `,
})
export class Editor {
  readonly library = inject(LibraryService);

  readonly vehicleId = signal<string | null>(null);
  readonly open = signal<CompartmentId | null>(null);
  readonly newName = signal('');

  readonly currentVehicle = computed(() =>
    this.vehicleId() ? this.library.vehicleById(this.vehicleId()!) : undefined,
  );

  constructor() {
    this.library.ensureStarterVehicle().then((v) => {
      if (v && this.vehicleId() === null) this.vehicleId.set(v.id);
    });
  }

  selectVehicle(id: string): void {
    this.vehicleId.set(id);
    this.open.set(null);
  }

  openCompartment(c: CompartmentId): void {
    this.open.set(this.open() === c ? null : c);
  }

  countIn(fach: CompartmentId): number {
    const id = this.vehicleId();
    if (!id) return 0;
    return this.library.placementsForVehicle(id).filter((p) => p.compartmentId === fach).length;
  }

  toggle(fach: CompartmentId, equipmentId: string): void {
    const id = this.vehicleId();
    if (id) this.library.togglePlacement(id, fach, equipmentId);
  }

  async addAndPlace(fach: CompartmentId): Promise<void> {
    const name = this.newName().trim();
    const id = this.vehicleId();
    if (!name || !id) return;
    const item = await this.library.addEquipment(name);
    await this.library.togglePlacement(id, fach, item.id);
    this.newName.set('');
  }
}
