# Agni

_Fahrzeugkunde_ — offline-capable Angular PWA for learning where the standardized equipment
(Beladung) is stored on German fire-brigade vehicles. Show an item, tap the
compartment it belongs in on a truck schematic, reveal correct/incorrect — then
pull the real tool off the truck.

## Status — v1 (In-Person mode)

- **In-Person Locate game**: single tablet, group at the truck, author-paced.
- **Content editor**: pick a compartment on the schematic, tick what's stored there.
- **One vehicle type**: the LF (reuses the `LfSketch` schematic from the sibling
  `feuerwehr-activity`), with a provisional DIN 14530-11 loadout seed.
- Local-first persistence; a **Supabase** adapter swaps in behind the same port.

Design & decisions: [`CONTEXT.md`](./CONTEXT.md) and [`docs/adr/`](./docs/adr).

## Architecture (mode-agnostic, ADR-0004)

1. **Content layer** — `core/models`, `core/library` (the Library facade).
2. **Challenge engine** — `core/challenge` (pure `generateLocate` + anti-repeat picker).
3. **Session driver** — `core/session` (In-Person; more modes later).
4. **Presentation** — `features/*`, `shared/lf-sketch`, spartan-ng helm UI (`shared/ui`).

Persistence is a swappable **`ContentStore` port** (`core/content`): a local
`localStorage` adapter (default) and a `SupabaseContentStore` selected by
`core/content/supabase.config.ts`.

## Develop

```bash
npm install
npm start          # ng serve → http://localhost:4200
npm test           # vitest unit tests
npm run build      # production build
```

## Enable Supabase (optional)

1. Create a Supabase project; run [`docs/supabase/schema.sql`](./docs/supabase/schema.sql).
2. Seed the LF `vehicle_types` row (see the SQL file's footer).
3. Set `USE_SUPABASE = true` + the URL/anon key in
   `src/app/core/content/supabase.config.ts`.

## Deploy

Push to `main` → GitHub Actions builds with `--base-href=/agni/` and
publishes to GitHub Pages (`.github/workflows/deploy.yml`).

## Roadmap

Learning mode · Online PvP (Kahoot-style realtime) · richer scoring
(team-vs-team, timed multi-step) · more challenge types (Identify, Name-loadout,
True/False) · more vehicle types (data-driven schematic renderer).
