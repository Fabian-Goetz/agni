import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '../../shared/ui/hlm-button.directive';

/** Landing screen — pick a Game Mode. v1 ships In-Person; others are roadmap. */
@Component({
  selector: 'fk-home',
  imports: [RouterLink, HlmButton],
  template: `
    <main class="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-5 py-10">
      <header class="text-center">
        <h1 class="text-3xl font-black tracking-tight text-primary">Agni</h1>
        <p class="mt-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Fahrzeugkunde
        </p>
        <p class="mt-2 text-sm text-muted-foreground">
          Wo liegt was auf dem Fahrzeug? Tippen, aufdecken, nachschauen.
        </p>
      </header>

      <section class="flex flex-col gap-3">
        <a hlmBtn size="xl" routerLink="/select">🚒 In-Person Spiel starten</a>
        <a hlmBtn variant="outline" size="xl" routerLink="/editor">🧰 Beladung bearbeiten</a>
      </section>

      <section class="mt-4">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bald verfügbar
        </p>
        <ul class="flex flex-col gap-2 text-sm text-muted-foreground">
          <li class="rounded-md border border-border/60 bg-card/50 px-4 py-3">🎓 Lernmodus (solo)</li>
          <li class="rounded-md border border-border/60 bg-card/50 px-4 py-3">
            ⚔️ Online-Quiz (PvP, Kahoot-Style)
          </li>
        </ul>
      </section>
    </main>
  `,
})
export class Home {}
