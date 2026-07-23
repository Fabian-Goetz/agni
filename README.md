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
- **Supabase** backend: Authors sign in (email/password or Google) and own an
  RLS-scoped Library; a localStorage adapter swaps in behind the same port for
  fully-offline/local use (`USE_SUPABASE = false`).

Design & decisions: [`CONTEXT.md`](./CONTEXT.md) and [`docs/adr/`](./docs/adr).

## Architecture (mode-agnostic, ADR-0004)

1. **Content layer** — `core/models`, `core/library` (the Library facade).
2. **Challenge engine** — `core/challenge` (pure `generateLocate` + anti-repeat picker).
3. **Session driver** — `core/session` (In-Person; more modes later).
4. **Presentation** — `features/*`, `shared/lf-sketch`, spartan-ng helm UI (`shared/ui`).

Persistence is a swappable **`ContentStore` port** (`core/content`) with granular
add/put/remove ops: a `SupabaseContentStore` (active) and a `localStorage`
adapter, selected by `core/content/supabase.config.ts`. Auth lives in
`core/auth` and shares one client with the store so RLS scopes every query.

## Develop

```bash
npm install
npm start          # ng serve → http://localhost:4200
npm test           # vitest unit tests
npm run build      # production build
```

## Backend (Supabase)

Supabase is the active backend (`USE_SUPABASE = true` in
`src/app/core/content/supabase.config.ts`; the publishable key is safe to ship —
RLS protects the data). Authors sign in (email/password or Google) and get a
private, RLS-scoped Library. To point at your own project:

1. **Schema + seed.** In the Supabase SQL editor run
   [`docs/supabase/schema.sql`](./docs/supabase/schema.sql), then
   [`docs/supabase/seed.sql`](./docs/supabase/seed.sql) (shared vehicle types +
   the DIN equipment catalog). `seed.sql` is generated from
   `src/app/core/seed/seed-lf.ts` — regenerate it if the seed changes.
2. **Config.** Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` (Settings → API →
   Project API keys → `anon`/publishable) in `supabase.config.ts`. Set
   `USE_SUPABASE = false` to run fully offline/local with no accounts instead.
3. **Google provider.** Authentication → Providers → Google: enable it and paste
   the Google OAuth client ID + secret (from Google Cloud console). Add the
   Supabase callback URL to Google's *Authorized redirect URIs*.
4. **Redirect allow-list.** Authentication → URL Configuration: add the app
   origins as redirect URLs — `http://localhost:4200/` for dev and the deployed
   `https://<user>.github.io/agni/` for Pages.
5. **Email confirmation** (optional) — off gives instant password sign-up; on
   shows a "check your inbox" message after registering.

Data model: `vehicle_types` and the DIN `equipment` seed rows are shared,
read-only reference data (`owner_id null`); each Author's vehicles, placements,
and any custom equipment are RLS-scoped to `auth.uid()`.

## Deploy

Push to `main` → GitHub Actions builds with `--base-href=/agni/` and
publishes to GitHub Pages (`.github/workflows/deploy.yml`).

## Roadmap

Learning mode · Online PvP (Kahoot-style realtime) · richer scoring
(team-vs-team, timed multi-step) · more challenge types (Identify, Name-loadout,
True/False) · more vehicle types (data-driven schematic renderer).
