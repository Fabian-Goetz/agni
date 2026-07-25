import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../core/library/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { ActivitySessionStore } from '../../core/activity/activity-session.store';
import { DEFAULT_ACTIVITY_CONFIG, MAX_TEAMS } from '../../core/activity/activity-config';
import { DIFFICULTIES, Difficulty } from '../../core/models/activity-card';
import { GAMES } from '../../core/session/round-config';

const TEAM_NAMES = ['Rot', 'Blau', 'Grün', 'Gelb'];

/**
 * Activity setup — teams, vehicle, which Stufen count, and the knobs.
 *
 * A screen of its own rather than a branch of `/select`: that one is deliberately
 * lean ("which vehicle, how many questions", screen-flow §5.2) and teams, layer
 * toggles, points and two clocks would double it. Follows the Gerätehaus hub
 * pattern — shell-level back chip, bare-noun H1, quiet section labels
 * (design-guidelines §7a).
 */
@Component({
  selector: 'fk-activity-setup',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './activity-setup.html',
  styleUrl: './activity-setup.scss',
})
export class ActivitySetup {
  readonly library = inject(LibraryService);
  readonly auth = inject(AuthService);
  private readonly session = inject(ActivitySessionStore);
  private readonly router = inject(Router);
  readonly showAccount = USE_SUPABASE;

  readonly game = GAMES.activity;
  readonly difficulties = DIFFICULTIES;
  readonly teamSizes = Array.from({ length: MAX_TEAMS }, (_, i) => i + 1);

  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  readonly teams = signal<string[]>(TEAM_NAMES.slice(0, 2));
  readonly selectedVehicleId = signal<string | null>(null);
  readonly locateOn = signal(DEFAULT_ACTIVITY_CONFIG.stufen.locate);
  readonly fetchOn = signal(DEFAULT_ACTIVITY_CONFIG.stufen.fetch);
  readonly points = signal({ ...DEFAULT_ACTIVITY_CONFIG.points });
  readonly roundSeconds = signal({ ...DEFAULT_ACTIVITY_CONFIG.roundSeconds });
  readonly locateBonus = signal(DEFAULT_ACTIVITY_CONFIG.locateBonus);
  readonly fetchBonus = signal(DEFAULT_ACTIVITY_CONFIG.fetchBonus);
  readonly fetchSeconds = signal(DEFAULT_ACTIVITY_CONFIG.fetchSeconds);
  readonly tuning = signal(false);

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

  /**
   * How many cards the round can deal. With Stufe 2 on this is the intersection
   * of the card set and what the truck actually carries — the Fach question has
   * no answer for an item that isn't aboard.
   */
  readonly poolSize = computed(() => {
    const v = this.vehicle();
    return v ? this.library.activityPoolSize(v.id, this.locateOn()) : 0;
  });

  /** Stufe 2 draws the schematic — catalog stubs have none (ADR-0003). */
  readonly hasSchematic = computed(() => {
    const v = this.vehicle();
    return !!v && this.library.hasSchematic(v.id);
  });

  readonly isSolo = computed(() => this.teams().length === 1);
  readonly namesOk = computed(() => this.teams().every((t) => t.trim().length > 0));
  readonly schematicOk = computed(() => !this.locateOn() || this.hasSchematic());

  // ---- the stepper ---------------------------------------------------------

  /** Which step is showing. Sequential — see `goTo`. */
  readonly step = signal(0);

  /** One question per screen, onboarding-style: the question *is* the headline. */
  readonly steps = [
    {
      title: 'Wer spielt?',
      lede: 'Ein bis vier Teams. Bei einem Team zählt, in wie wenigen Zügen du am Ziel bist.',
    },
    {
      title: 'Woran wird gespielt?',
      lede: 'Das Fahrzeug liefert die Fächer für Stufe 2 und die Geräte, die geholt werden.',
    },
    {
      title: 'Was zählt?',
      lede: 'Stufe 1 ist immer dabei. Zwei und drei schaltest du dazu.',
    },
  ] as const;
  readonly lastStep = this.steps.length - 1;
  readonly current = computed(() => this.steps[this.step()]);

  /**
   * Whether a step's own answers are usable. Deliberately **not** wired to the
   * Weiter button: the steps are interdependent (Stufe 2 on step 3 decides
   * whether step 2 needs a Fach-Layout), so blocking forward movement could
   * strand an Author on a step whose fix lives on a later one — and with the
   * navigable chips gone, paging forward is the only way to reach it. Only the
   * final start is gated; a problem is stated inline on the step that owns it.
   */
  stepValid(index: number): boolean {
    switch (index) {
      case 0:
        return this.namesOk();
      case 1:
        return !this.preparing() && !!this.vehicle() && this.schematicOk();
      default:
        return this.poolSize() > 0;
    }
  }

  readonly canStart = computed(
    () => this.stepValid(0) && this.stepValid(1) && this.stepValid(2),
  );

  /** Keeps the chosen setup readable while a step hides the other two. */
  readonly summary = computed(() => {
    const teams = this.isSolo() ? 'Solo' : `${this.teams().length} Teams`;
    const vehicle = this.vehicle()?.name ?? '—';
    const stufen = ['1', this.locateOn() ? '2' : null, this.fetchOn() ? '3' : null]
      .filter(Boolean)
      .join(' + ');
    return `${teams} · ${vehicle} · Stufen ${stufen}`;
  });

  goTo(index: number): void {
    this.step.set(Math.min(this.lastStep, Math.max(0, index)));
  }

  next(): void {
    this.goTo(this.step() + 1);
  }

  prev(): void {
    this.goTo(this.step() - 1);
  }

  /** How many Stufen a clean Zug runs through — the max points on offer. */
  readonly maxPoints = computed(
    () =>
      this.points().Schwer +
      (this.locateOn() ? this.locateBonus() : 0) +
      (this.fetchOn() ? this.fetchBonus() : 0),
  );

  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  /**
   * True until the Library has loaded *and* the starter vehicle has been cloned.
   * Both are async, so without this the screen renders its "no vehicle" empty
   * state for the moment before the vehicle it is about to create exists —
   * telling the Author their Gerätehaus is empty while filling it (§7).
   */
  readonly preparing = signal(true);

  constructor() {
    void this.library
      .ensureStarterVehicle()
      .then((v) => {
        if (v && this.selectedVehicleId() === null) this.selectedVehicleId.set(v.id);
      })
      .finally(() => this.preparing.set(false));
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  chooseVehicle(id: string): void {
    this.selectedVehicleId.set(id);
  }

  vehicleNote(vehicleId: string): string {
    if (this.locateOn() && !this.library.hasSchematic(vehicleId)) return 'Kein Fächer-Layout';
    return `${this.library.activityPoolSize(vehicleId, this.locateOn())} Karten`;
  }

  /** Grow or shrink the roster, keeping any names already typed. */
  setTeamCount(n: number): void {
    this.teams.update((current) =>
      Array.from({ length: n }, (_, i) => current[i] ?? TEAM_NAMES[i] ?? `Team ${i + 1}`),
    );
  }

  renameTeam(index: number, value: string): void {
    this.teams.update((current) => current.map((t, i) => (i === index ? value : t)));
  }

  pointsFor(difficulty: Difficulty): number {
    return this.points()[difficulty];
  }

  secondsFor(difficulty: Difficulty): number {
    return this.roundSeconds()[difficulty];
  }

  setPoints(difficulty: Difficulty, value: string): void {
    const n = this.clamp(value, 1, 20);
    if (n !== null) this.points.update((p) => ({ ...p, [difficulty]: n }));
  }

  setSeconds(difficulty: Difficulty, value: string): void {
    const n = this.clamp(value, 10, 300);
    if (n !== null) this.roundSeconds.update((s) => ({ ...s, [difficulty]: n }));
  }

  setLocateBonus(value: string): void {
    const n = this.clamp(value, 0, 20);
    if (n !== null) this.locateBonus.set(n);
  }

  setFetchBonus(value: string): void {
    const n = this.clamp(value, 0, 20);
    if (n !== null) this.fetchBonus.set(n);
  }

  setFetchSeconds(value: string): void {
    const n = this.clamp(value, 10, 300);
    if (n !== null) this.fetchSeconds.set(n);
  }

  private clamp(value: string, min: number, max: number): number | null {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
  }

  start(): void {
    const v = this.vehicle();
    if (!v || !this.canStart()) return;
    this.session.start({
      vehicleId: v.id,
      teams: this.teams().map((t) => t.trim()),
      stufen: { locate: this.locateOn(), fetch: this.fetchOn() },
      points: this.points(),
      locateBonus: this.locateBonus(),
      fetchBonus: this.fetchBonus(),
      roundSeconds: this.roundSeconds(),
      fetchSeconds: this.fetchSeconds(),
    });
    this.router.navigate(['/activity/play'], { replaceUrl: true });
  }
}
