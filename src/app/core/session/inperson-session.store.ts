import { Injectable, computed, inject, signal } from '@angular/core';
import { LibraryService } from '../library/library.service';
import { LocatePicker } from '../challenge/locate-picker';
import { generateLocate, isCorrect, LocateChallenge } from '../challenge/challenge';
import { randomSelect } from '../util/random';
import { CompartmentId } from '../models/compartment';

/**
 * In-Person Game Mode session driver (ADR-0004): single device, author-paced,
 * Locate challenges over one Vehicle. Unscored beyond a light end tally.
 */
@Injectable({ providedIn: 'root' })
export class InPersonSessionStore {
  private readonly library = inject(LibraryService);

  private readonly _vehicleId = signal<string | null>(null);
  private readonly _current = signal<LocateChallenge | null>(null);
  private readonly _picked = signal<CompartmentId | null>(null);
  private readonly _asked = signal(0);
  private readonly _correct = signal(0);

  readonly current = this._current.asReadonly();
  readonly picked = this._picked.asReadonly();
  readonly asked = this._asked.asReadonly();
  readonly correctCount = this._correct.asReadonly();

  readonly revealed = computed(() => this._picked() !== null);
  readonly lastWasCorrect = computed(() => {
    const c = this._current();
    const p = this._picked();
    return c !== null && p !== null && isCorrect(c, p);
  });

  private picker = new LocatePicker(randomSelect);

  /** Begin a session on a vehicle and deal the first challenge. */
  start(vehicleId: string): void {
    this._vehicleId.set(vehicleId);
    this.picker = new LocatePicker(randomSelect);
    this._asked.set(0);
    this._correct.set(0);
    this.next();
  }

  /** Deal the next challenge. */
  next(): void {
    const vehicleId = this._vehicleId();
    if (!vehicleId) return;
    const subject = this.picker.pick(this.library.placedEquipment(vehicleId));
    if (!subject) {
      this._current.set(null);
      return;
    }
    const compartmentIds = this.library
      .compartmentsForVehicle(vehicleId)
      .map((c) => c.id);
    this._picked.set(null);
    this._current.set(
      generateLocate({
        subject,
        vehicleId,
        placements: this.library.placementsForVehicle(vehicleId),
        compartmentIds,
      }),
    );
    this._asked.update((n) => n + 1);
  }

  /** Register a tap and reveal the answer. */
  pick(compartmentId: CompartmentId): void {
    if (this.revealed()) return;
    this._picked.set(compartmentId);
    if (this.lastWasCorrect()) this._correct.update((n) => n + 1);
  }
}
