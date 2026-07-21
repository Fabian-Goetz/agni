# ADR-0002: Supabase (Postgres + Auth + RLS) as backend

## Status
Accepted

## Context
The game requires real multi-user support: admins author content that players
consume live, with roles enforced server-side and per-user progress synced. This
is a deliberate departure from the sibling `feuerwehr-activity`, which is a pure
static PWA with no backend.

The domain model is relational — vehicles, vehicle types, compartments,
equipment catalog, and placements, with several many-to-many relationships. Core
queries (e.g. "load vehicle Z with all compartments and placed equipment") are
natural joins.

Options considered:
1. **Supabase** — Postgres + Auth + Row-Level Security. Chosen.
2. **Firebase (Firestore + Auth)** — fastest to ship and realtime by default, but
   the join-heavy relational model forces denormalization/nested docs and the
   security rules for it get verbose. Rejected on data-shape fit.
3. **Custom API server** — full control, but ops/cost unjustified for a hobby
   game with no always-on free tier worth maintaining. Rejected.

## Decision
Use **Supabase**. Postgres holds the relational schema; Supabase Auth handles
accounts; Row-Level Security enforces roles declaratively (an `is_admin()`
predicate gates writes; reads are open to authenticated—or anon—users).
The Angular frontend stays static-hosted; only data and auth live in Supabase.

## Persistence-timing resolution (grilling)
Supabase is the chosen backend and **will be implemented** (education/portfolio
value + v2 foundation). But v1's scope (single author, single device, in-person,
offline) needs no server. Resolution: all persistence goes through a
**`ContentStore` port** (hexagonal seam). v1 ships a **local adapter**
(IndexedDB/localStorage); the **Supabase adapter** implements the same port and
swaps in underneath with **zero domain changes** — ideally toggled by config.
The Supabase adapter may be written during v1 (in parallel) or as an immediate
fast-follow; either way the domain, Challenge engine, and Session drivers are
unaware of which adapter is active.

## Consequences
- **+** Relational model maps directly; loadout reads are plain joins.
- **+** `ContentStore` port lets v1 ship local-first and offline while keeping
  Supabase a drop-in, de-risking both timelines.
- **+** Role enforcement is declarative and lives next to the data (RLS), not
  scattered through client code.
- **+** Generous free tier; SQL migrations give versioned schema.
- **−** We own SQL/migrations and RLS policies (a learning cost).
- **−** Free-tier Supabase projects pause on inactivity; acceptable for a hobby
  game, revisit if it hurts.
- Frontend must handle unauthenticated/anon read state and auth flows.
