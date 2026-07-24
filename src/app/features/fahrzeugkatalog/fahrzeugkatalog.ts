import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../core/library/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { VehicleType } from '../../core/models/vehicle-type';

interface ClassChip {
  ordnungsnummer: string;
  label: string;
  klasse: string;
}

/** Compact chip labels per taktische Ordnungsnummerngruppe (10 → 90). */
const CLASS_SHORT: Record<string, string> = {
  '10': 'Führung',
  '20': 'Tank/Lösch',
  '30': 'Hubrettung',
  '40': 'Löschgruppe',
  '50': 'Rüst/Gerät',
  '60': 'Schlauch/WLF',
  '70': 'Sonstige',
  '80': 'Rettungsdienst',
  '90': 'ABC/zbV',
};

/**
 * Fahrzeug-Katalog — the shared vehicle master-data reference (Gerätehaus, screen-
 * flow §7). Read-only browse over the seeded Fahrzeugkatalog: search + filter by
 * taktische Ordnungsnummer (10–90), detail with the normed specs (Besatzung,
 * Pumpe, Tank, DIN …), educational was/wozu, and the loadout status. Mirrors the
 * Geräte-Katalog (katalog.ts); same design language "C".
 */
@Component({
  selector: 'fk-fahrzeugkatalog',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './fahrzeugkatalog.html',
  styleUrl: './fahrzeugkatalog.scss',
})
export class Fahrzeugkatalog {
  readonly library = inject(LibraryService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly showAccount = USE_SUPABASE;

  readonly theme = signal<'light' | 'dark'>(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  readonly search = signal('');
  readonly activeClass = signal('Alle');
  private readonly selectedId = signal<string | null>(null);

  constructor() {
    void this.library.ensureLoaded();
  }

  /** Distinct Ordnungsnummer groups present in the catalog, sorted 10 → 90. */
  readonly classes = computed<ClassChip[]>(() => {
    const seen = new Map<string, string>();
    for (const t of this.library.vehicleTypes()) {
      if (t.ordnungsnummer && !seen.has(t.ordnungsnummer)) {
        seen.set(t.ordnungsnummer, t.klasse ?? '');
      }
    }
    return [...seen.entries()]
      .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
      .map(([ordnungsnummer, klasse]) => ({
        ordnungsnummer,
        klasse,
        label: `${ordnungsnummer} · ${CLASS_SHORT[ordnungsnummer] ?? klasse}`,
      }));
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cls = this.activeClass();
    return this.library
      .vehicleTypes()
      .filter((t) => {
        if (cls !== 'Alle' && t.ordnungsnummer !== cls) return false;
        if (!q) return true;
        const hay = [t.name, t.langbezeichnung ?? '', ...(t.synonyms ?? []), t.kategorie ?? '']
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort(
        (a, b) =>
          parseInt(a.ordnungsnummer || '0', 10) - parseInt(b.ordnungsnummer || '0', 10) ||
          a.name.localeCompare(b.name, 'de'),
      );
  });

  readonly selected = computed<VehicleType | undefined>(() => {
    const id = this.selectedId();
    const found = id ? this.library.vehicleTypes().find((t) => t.id === id) : undefined;
    return found ?? this.filtered()[0];
  });

  /** Loadout stats for a type: placements + distinct compartments carrying them. */
  loadout(t: VehicleType): { geraete: number; faecher: number } {
    const faecher = new Set(t.defaultLoadout.map((p) => p.compartmentId));
    return { geraete: t.defaultLoadout.length, faecher: faecher.size };
  }

  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  /** Tile mark: the letter prefix of the Kurzbezeichnung (LF 20 → LF, DLK 23 → DLK). */
  abbr(t: VehicleType): string {
    const letters = t.name.match(/^[A-Za-zÄÖÜ]+/)?.[0];
    return (letters ?? t.name).slice(0, 4).toUpperCase();
  }

  toggleTheme(): void {
    this.theme.update((v) => (v === 'dark' ? 'light' : 'dark'));
  }

  select(id: string): void {
    this.selectedId.set(id);
  }

  setClass(cls: string): void {
    this.activeClass.set(cls);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
