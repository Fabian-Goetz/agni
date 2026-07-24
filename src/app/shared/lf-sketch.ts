import { Component, input, output } from '@angular/core';
import { CompartmentId } from '../core/models/compartment';

interface Zone {
  c: CompartmentId;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fs: number;
}

/**
 * Top-down (Beladeplan-style) schematic of the LF with tappable compartments.
 * Front at the top: cab spans the front, G1/G3/G5 down the left, G2/G4/G6 down
 * the right, crew Fächer + roof in the centre. Emits (pick) until `revealed`.
 *
 * Lifted from the sibling feuerwehr-activity. Zone ids match the LF's
 * CompartmentId set; a data-driven renderer for other types is future work
 * (ADR-0003 keeps the picked/correct/selected/revealed + pick contract stable).
 */
@Component({
  selector: 'fk-lf-sketch',
  template: `
    <svg viewBox="0 0 300 384" class="mx-auto w-full max-w-md select-none" xmlns="http://www.w3.org/2000/svg">
      <!-- wheels -->
      <g fill="#0b0f16" stroke="#475569" stroke-width="2">
        <rect x="20" y="60" width="16" height="40" rx="5" />
        <rect x="264" y="60" width="16" height="40" rx="5" />
        <rect x="20" y="280" width="16" height="40" rx="5" />
        <rect x="264" y="280" width="16" height="40" rx="5" />
      </g>

      <!-- truck body -->
      <rect x="38" y="14" width="224" height="356" rx="18" fill="#0e1420" stroke="#ef4444" stroke-width="2.5" />

      <!-- orientation -->
      <text x="150" y="9" text-anchor="middle" font-size="8" fill="#64748b" style="pointer-events:none">▲ VORNE</text>
      <text x="150" y="381" text-anchor="middle" font-size="8" fill="#64748b" style="pointer-events:none">HECK</text>

      <!-- compartments -->
      @for (z of zones; track z.c) {
        <g [style.cursor]="revealed() ? 'default' : 'pointer'" (click)="tap(z.c)">
          <rect
            [attr.x]="z.x" [attr.y]="z.y" [attr.width]="z.w" [attr.height]="z.h" rx="5"
            [attr.fill]="fill(z.c)" [attr.stroke]="stroke(z.c)" [attr.stroke-width]="strokeW(z.c)"
          />
          <text
            [attr.x]="z.x + z.w / 2" [attr.y]="z.y + z.h / 2"
            text-anchor="middle" dominant-baseline="central"
            [attr.font-size]="z.fs" fill="#e2e8f0" font-weight="700" style="pointer-events:none"
          >{{ z.label }}</text>
        </g>
      }

      <!-- Mannschaftskabine grouping (decorative) -->
      <g style="pointer-events:none">
        <rect x="92" y="74" width="116" height="138" rx="6" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="4 3" />
        <text x="150" y="83" text-anchor="middle" font-size="7" fill="#94a3b8" letter-spacing="0.5">MANNSCHAFTSKABINE</text>
      </g>

      <!-- windshield hint at the front of the cab (decorative) -->
      <path d="M60 24 L240 24 L228 40 L72 40 Z" fill="#bae6fd" opacity="0.18" style="pointer-events:none" />
    </svg>
  `,
})
export class LfSketch {
  readonly picked = input<CompartmentId | null>(null);
  readonly correct = input<CompartmentId[]>([]);
  readonly revealed = input(false);
  /** Editor: the Fach currently being worked — amber outline. */
  readonly selected = input<CompartmentId[]>([]);
  /** Editor: Fächer that carry the active Gerät — green fill ("it lives here"). */
  readonly marked = input<CompartmentId[]>([]);
  readonly pick = output<CompartmentId>();

  readonly zones: Zone[] = [
    { c: 'Fahrerkabine', x: 44, y: 22, w: 212, h: 44, label: 'Fahrerkabine', fs: 11 },
    // left side (odd): G1, G3, G5 front→rear
    { c: 'G1', x: 44, y: 78, w: 46, h: 74, label: 'G1', fs: 13 },
    { c: 'G3', x: 44, y: 162, w: 46, h: 74, label: 'G3', fs: 13 },
    { c: 'G5', x: 44, y: 246, w: 46, h: 74, label: 'G5', fs: 13 },
    // right side (even): G2, G4, G6 front→rear
    { c: 'G2', x: 210, y: 78, w: 46, h: 74, label: 'G2', fs: 13 },
    { c: 'G4', x: 210, y: 162, w: 46, h: 74, label: 'G4', fs: 13 },
    { c: 'G6', x: 210, y: 246, w: 46, h: 74, label: 'G6', fs: 13 },
    // centre front→rear: Mannschaftskabine (Angriffstrupp, Bank hinten), then Dach
    { c: 'Angriffstrupp', x: 96, y: 90, w: 108, h: 54, label: 'Angriffstrupp', fs: 9 },
    { c: 'Bank hinten', x: 96, y: 152, w: 108, h: 54, label: 'Bank hinten', fs: 9 },
    { c: 'Dach', x: 96, y: 218, w: 108, h: 102, label: 'Dach', fs: 13 },
  ];

  tap(c: CompartmentId): void {
    if (!this.revealed()) this.pick.emit(c);
  }

  fill(c: CompartmentId): string {
    if (this.revealed()) {
      if (this.correct().includes(c)) return '#16a34a';
      if (c === this.picked()) return '#dc2626';
      return '#1c2634';
    }
    if (this.marked().includes(c)) return '#15803d';
    if (this.selected().includes(c)) return '#2b2517';
    return '#1c2634';
  }

  private highlighted(c: CompartmentId): boolean {
    return this.revealed()
      ? this.correct().includes(c) || c === this.picked()
      : this.selected().includes(c) || this.marked().includes(c);
  }

  stroke(c: CompartmentId): string {
    if (this.revealed()) return this.highlighted(c) ? '#ffffff' : '#3a4a5e';
    // The worked Fach wins the outline, so it stays findable inside a green run.
    if (this.selected().includes(c)) return '#eab308';
    if (this.marked().includes(c)) return '#22c55e';
    return '#3a4a5e';
  }

  strokeW(c: CompartmentId): number {
    return this.highlighted(c) ? 2.5 : 1;
  }
}
