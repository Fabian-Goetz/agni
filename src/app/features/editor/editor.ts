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
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
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
