import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LibraryService } from '../../core/library/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { USE_SUPABASE } from '../../core/content/supabase.config';
import { Equipment } from '../../core/models/equipment';
import { VehicleType } from '../../core/models/vehicle-type';

interface Usage {
  type: VehicleType;
  faecher: string[];
}

/**
 * Geräte-Katalog — the shared equipment reference (Gerätehaus, screen-flow §7.3).
 * Read-only browse over the seeded catalog: search + category filter, detail with
 * educational was/wozu and where each Gerät is verlastet. Ported from
 * docs/design/screens/07-geraete-katalog.html.
 */
@Component({
  selector: 'fk-katalog',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './katalog.html',
  styleUrl: './katalog.scss',
})
export class Katalog {
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
  readonly activeCategory = signal('Alle');
  private readonly selectedId = signal<string | null>(null);

  constructor() {
    void this.library.ensureLoaded();
  }

  readonly categories = computed(() => {
    const cats = [...new Set(this.library.equipment().map((e) => e.category).filter(Boolean))].sort(
      (a, b) => (a as string).localeCompare(b as string, 'de'),
    );
    return ['Alle', ...(cats as string[])];
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.activeCategory();
    return this.library.equipmentSorted().filter((e) => {
      if (cat !== 'Alle' && e.category !== cat) return false;
      if (!q) return true;
      const hay = [e.name, ...(e.synonyms ?? []), e.kurzzeichen ?? '', e.category ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  readonly selected = computed<Equipment | undefined>(() => {
    const id = this.selectedId();
    const found = id ? this.library.equipment().find((e) => e.id === id) : undefined;
    return found ?? this.filtered()[0];
  });

  /** equipmentId → the seeded vehicle types (+ compartments) that carry it. */
  private readonly usageByEquipment = computed(() => {
    const map = new Map<string, Usage[]>();
    for (const type of this.library.vehicleTypes()) {
      const faecherByEq = new Map<string, string[]>();
      for (const p of type.defaultLoadout) {
        const arr = faecherByEq.get(p.equipmentId) ?? [];
        if (!arr.includes(p.compartmentId)) arr.push(p.compartmentId);
        faecherByEq.set(p.equipmentId, arr);
      }
      for (const [eqId, faecher] of faecherByEq) {
        const list = map.get(eqId) ?? [];
        list.push({ type, faecher });
        map.set(eqId, list);
      }
    }
    return map;
  });

  readonly initials = computed(() => {
    const email = this.auth.user()?.email ?? '';
    const parts = email.split('@')[0]?.split(/[.\-_]/).filter(Boolean) ?? [];
    const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : email.slice(0, 2)) || '?';
    return letters.toUpperCase();
  });

  usageFor(id: string): Usage[] {
    return this.usageByEquipment().get(id) ?? [];
  }

  /** Two/three-letter tile mark: Kurzzeichen if any, else derived from the name. */
  abbr(e: Equipment): string {
    if (e.kurzzeichen) return e.kurzzeichen.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
    const words = e.name.split(/[\s-]+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return e.name.slice(0, 2).toUpperCase();
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  select(id: string): void {
    this.selectedId.set(id);
  }

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
