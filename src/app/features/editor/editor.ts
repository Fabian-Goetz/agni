import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VehicleSchematic } from '../../shared/vehicle-schematic';
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
  imports: [VehicleSchematic, FormsModule, RouterLink, HlmButton, HlmCard],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  readonly library = inject(LibraryService);
  private readonly route = inject(ActivatedRoute);

  readonly vehicleId = signal<string | null>(null);
  readonly open = signal<CompartmentId | null>(null);
  readonly newName = signal('');

  readonly currentVehicle = computed(() =>
    this.vehicleId() ? this.library.vehicleById(this.vehicleId()!) : undefined,
  );

  /** The type drives which schematic gets drawn (ADR-0003). */
  readonly vehicleType = computed(() => {
    const v = this.currentVehicle();
    return v ? this.library.typeById(v.typeId) : undefined;
  });

  /**
   * Only vehicles whose type carries a compartment layout can be edited — the
   * Fahrzeugkatalog master-data stubs have none, so there is nothing to draw.
   */
  readonly hasSchematic = computed(() => {
    const id = this.vehicleId();
    return !!id && this.library.hasSchematic(id);
  });

  constructor() {
    // Deep-link from the Fuhrpark ("Beladen →"): ?vehicle=<id> opens that truck,
    // otherwise fall back to the starter vehicle.
    const requested = this.route.snapshot.queryParamMap.get('vehicle');
    this.library.ensureStarterVehicle().then((v) => {
      if (this.vehicleId() !== null) return;
      if (requested && this.library.vehicleById(requested)) this.vehicleId.set(requested);
      else if (v) this.vehicleId.set(v.id);
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
