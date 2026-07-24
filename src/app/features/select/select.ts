import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LibraryService } from '../../core/library/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { InPersonSessionStore } from '../../core/session/inperson-session.store';
import { GAMES, toGameId } from '../../core/session/round-config';
import { USE_SUPABASE } from '../../core/content/supabase.config';

const COUNT_OPTIONS = [10, 20, 30, null] as const;

/**
 * Round setup — pick which Vehicle to drill for the game chosen in the launcher,
 * choose a question count, start. A "ready?" confirmation, kept lean on purpose:
 * per-round knobs beyond count live in the Editor/Library, not here (screen-flow
 * §5.2). Ported from docs/design/screens/03-vorbereiten.html (chooser variant).
 */
@Component({
  selector: 'fk-select',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select {
  readonly library = inject(LibraryService);
  readonly auth = inject(AuthService);
  private readonly session = inject(InPersonSessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly showAccount = USE_SUPABASE;

  readonly countOptions = COUNT_OPTIONS;

  /** Which game we're setting up — comes from the launcher (?game=…). */
  readonly game = toSignal(
    this.route.queryParamMap.pipe(map((p) => GAMES[toGameId(p.get('game'))])),
    { initialValue: GAMES['fach-finder'] },
  );

  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  readonly selectedVehicleId = signal<string | null>(null);
  readonly count = signal<number | null>(20);

  readonly vehicles = this.library.vehicles;
  readonly vehicle = computed(() => {
    const id = this.selectedVehicleId();
    const list = this.vehicles();
    return (id ? list.find((v) => v.id === id) : undefined) ?? list[0];
  });
  readonly vehicleType = computed(() => {
    const v = this.vehicle();
    return v ? this.library.typeById(v.typeId) : undefined;
  });

  /** Distinct placed items on the current vehicle — the question pool. */
  readonly poolSize = computed(() => {
    const v = this.vehicle();
    return v ? this.library.placedEquipment(v.id).length : 0;
  });
  readonly compartmentCount = computed(() => {
    const v = this.vehicle();
    return v ? this.library.compartmentsForVehicle(v.id).length : 0;
  });

  /** How many questions the round will actually ask. */
  readonly roundLength = computed(() => {
    const limit = this.count();
    return limit === null ? this.poolSize() : Math.min(limit, this.poolSize());
  });
  readonly estMinutes = computed(() => Math.max(1, Math.round((this.roundLength() * 40) / 60)));

  /** The round draws on the type's schematic — catalog stubs have none (ADR-0003). */
  readonly hasSchematic = computed(() => {
    const v = this.vehicle();
    return !!v && this.library.hasSchematic(v.id);
  });
  readonly canStart = computed(() => this.hasSchematic() && this.roundLength() > 0);

  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  placedCount(vehicleId: string): number {
    return this.library.placedEquipment(vehicleId).length;
  }

  /** Per-option summary in the chooser — flags the ones that can't be drilled. */
  vehicleNote(vehicleId: string): string {
    return this.library.hasSchematic(vehicleId)
      ? `${this.placedCount(vehicleId)} Geräte`
      : 'Kein Fächer-Layout';
  }

  constructor() {
    void this.library.ensureStarterVehicle().then((v) => {
      if (v && this.selectedVehicleId() === null) this.selectedVehicleId.set(v.id);
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  chooseVehicle(id: string): void {
    this.selectedVehicleId.set(id);
  }

  setCount(value: number | null): void {
    this.count.set(value);
  }

  start(): void {
    const v = this.vehicle();
    if (!v || !this.canStart()) return;
    this.session.start({ vehicleId: v.id, game: this.game().id, limit: this.count() });
    this.router.navigate(['/play'], { replaceUrl: true });
  }
}
