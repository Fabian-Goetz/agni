import { Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleSchematic } from '../../shared/vehicle-schematic';
import { LibraryService } from '../../core/library/library.service';
import { ActivitySessionStore } from '../../core/activity/activity-session.store';
import { CompartmentId } from '../../core/models/compartment';
import { DIFFICULTIES, Difficulty } from '../../core/models/activity-card';
import { GAMES } from '../../core/session/round-config';

/** What the moderator is told to do, per performance mode. */
const MODE_HINT: Record<string, string> = {
  Beschreiben: 'Erklären — ohne die Tabu-Wörter zu sagen.',
  Zeichnen: 'Zeichnen — kein Wort, keine Zahlen, keine Buchstaben.',
  Pantomime: 'Vormachen — ohne Ton.',
};

/**
 * Activity round: board → Übergabe → Darstellen → Verorten → Holen → Zug-Ergebnis,
 * then the next team. Every phase is a **state of this one screen**, following the
 * precedent set by the Fach-Finder summary (screen-flow §3): they share the session
 * store, and a separate route would have to carry or refetch it.
 *
 * Runs on round chrome (design-guidelines §6) — no brand topbar, no footer.
 */
@Component({
  selector: 'fk-activity-play',
  imports: [VehicleSchematic],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './activity-play.html',
  styleUrl: './activity-play.scss',
})
export class ActivityPlay {
  readonly session = inject(ActivitySessionStore);
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);

  readonly game = GAMES.activity;
  readonly difficulties = DIFFICULTIES;

  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  readonly vehicle = computed(() => {
    const id = this.session.config()?.vehicleId;
    return id ? this.library.vehicleById(id) : undefined;
  });

  readonly vehicleType = computed(() => {
    const v = this.vehicle();
    return v ? this.library.typeById(v.typeId) : undefined;
  });

  private readonly compartments = computed(() => {
    const id = this.session.config()?.vehicleId;
    return id ? this.library.compartmentsForVehicle(id) : [];
  });

  readonly stufen = computed(() => this.session.config()?.stufen ?? { locate: false, fetch: false });

  /** The board, one cell per field, with whoever stands on it. */
  readonly cells = computed(() => {
    const game = this.session.game();
    if (!game) return [];
    const positions = game.positions();
    return game.boardCells.map((cell, index) => ({
      index,
      cell,
      short: cell === 'Ziel' ? 'ZIEL' : cell[0],
      current: index === positions[game.currentTeam() ?? -1],
      occupants: positions.flatMap((p, team) => (p === index ? [team] : [])),
    }));
  });

  /** Standings, best first — the board is the score, so read it off the board. */
  readonly standings = computed(() => {
    const game = this.session.game();
    if (!game) return [];
    return game.teams
      .map((name, team) => ({
        team,
        name,
        position: game.positions()[team] ?? 0,
        zuege: game.turnsByTeam()[team] ?? 0,
        won: game.finished().includes(team),
      }))
      .sort((a, b) => b.position - a.position);
  });

  readonly winner = computed(() => this.standings().find((s) => s.won));

  readonly modeHint = computed(() => {
    const mode = this.session.perform()?.mode ?? this.session.currentMode();
    return mode ? MODE_HINT[mode] : '';
  });

  /** Where the current item actually lives, spelled out for the reveal. */
  readonly correctLabel = computed(() =>
    this.labelsFor(this.session.locate()?.correct ?? []),
  );

  readonly outcomeCorrectLabel = computed(() =>
    this.labelsFor(this.session.outcome()?.correctCompartments ?? []),
  );

  readonly outcomePickedLabel = computed(() => {
    const picked = this.session.outcome()?.pickedCompartment;
    return picked ? this.compartmentLabel(picked) : '';
  });

  /** Countdown as m:ss, and as a draining rail. */
  readonly clock = computed(() => {
    const left = this.session.secondsLeft();
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  });

  readonly clockPct = computed(() => {
    const total = this.session.clockTotal();
    return total === 0 ? 0 : Math.round((this.session.secondsLeft() / total) * 100);
  });

  /** Under ten seconds the clock goes red — the one time colour alone is fine. */
  readonly clockLow = computed(
    () => this.session.clockTotal() > 0 && this.session.secondsLeft() <= 10,
  );

  /** A setup that cannot deal a single card — say so instead of dealing nothing. */
  readonly emptyPool = computed(
    () => this.session.game() !== null && this.session.poolSize() === 0,
  );

  /** Set before an intentional exit, so the bounce-to-setup effect stands down. */
  private readonly leaving = signal(false);

  constructor() {
    // Deep link or refresh with no game in memory: back to setup. Skipped while
    // leaving — `quit()` also empties the store, and without this the effect
    // would race the navigation to Home and win.
    effect(() => {
      if (!this.leaving() && this.session.game() === null) {
        this.router.navigate(['/activity'], { replaceUrl: true });
      }
    });
  }

  compartmentLabel(id: CompartmentId): string {
    return this.compartments().find((c) => c.id === id)?.label ?? id;
  }

  private labelsFor(ids: CompartmentId[]): string {
    return ids.map((id) => this.compartmentLabel(id)).join(' · ');
  }

  teamName(team: number): string {
    return this.session.teams()[team] ?? '';
  }

  /** Points on offer for a gamble, and whether the pool can back it. */
  pointsFor(difficulty: Difficulty): number {
    return this.session.pointsFor(difficulty);
  }

  available(difficulty: Difficulty): number {
    return this.session.available(difficulty);
  }

  quit(): void {
    this.leaving.set(true);
    this.session.reset(); // also stops whichever clock was running
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  again(): void {
    this.session.restart();
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
