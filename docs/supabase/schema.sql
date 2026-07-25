-- Fahrzeugkunde — Supabase schema + RLS (ADR-0002).
-- Model: shared read-only DIN vehicle types; per-Author (owner) Library of
-- equipment, vehicles, and placements. RLS = "read/write your own Library".
-- Run in the Supabase SQL editor. Vehicle types are seeded once (see bottom).

-- ---------------------------------------------------------------------------
-- Shared reference: DIN vehicle types (compartments + default loadout as jsonb)
-- ---------------------------------------------------------------------------
create table if not exists vehicle_types (
  id                text primary key,
  name              text not null,
  compartments      jsonb not null,          -- Compartment[]
  default_loadout   jsonb not null,          -- DefaultPlacement[]
  has_custom_sketch boolean not null default false
);

-- Fahrzeugkatalog master data (taktische Ordnungsnummer 10–90). Idempotent so an
-- existing project gains the columns without a rebuild (mirrors equipment above).
alter table vehicle_types add column if not exists langbezeichnung  text;
alter table vehicle_types add column if not exists ordnungsnummer   text;
alter table vehicle_types add column if not exists klasse           text;
alter table vehicle_types add column if not exists kategorie        text;
alter table vehicle_types add column if not exists synonyms         text[];
alter table vehicle_types add column if not exists pumpe            text;
alter table vehicle_types add column if not exists besatzung        text;
alter table vehicle_types add column if not exists gesamtmasse      text;
alter table vehicle_types add column if not exists loeschwasser     text;
alter table vehicle_types add column if not exists hauptaufgabe     text;
alter table vehicle_types add column if not exists din_ref          text;
alter table vehicle_types add column if not exists antrieb          text;
alter table vehicle_types add column if not exists beschreibung     text;
alter table vehicle_types add column if not exists verwendung       text;

alter table vehicle_types enable row level security;

-- Everyone (authenticated) may read the shared catalog; nobody writes via anon key.
drop policy if exists vehicle_types_read on vehicle_types;
create policy vehicle_types_read on vehicle_types
  for select using (true);

-- ---------------------------------------------------------------------------
-- Per-Author Library
-- ---------------------------------------------------------------------------
-- Equipment is a shared canonical catalog (CONTEXT.md): the DIN seed rows have
-- owner_id null and are readable by everyone; Authors may add their own custom
-- items (owner_id = auth.uid()). Hence owner_id is nullable.
create table if not exists equipment (
  id       text primary key,
  owner_id uuid default auth.uid() references auth.users (id) on delete cascade,
  name     text not null,
  category text
);

-- Catalog metadata for the Geräte-Katalog (synonyms + educational was/wozu).
-- Idempotent so an existing project can gain the columns without a rebuild.
alter table equipment add column if not exists subcategory         text;
alter table equipment add column if not exists synonyms            text[];
alter table equipment add column if not exists kurzzeichen          text;
alter table equipment add column if not exists beschreibung         text;
alter table equipment add column if not exists verwendung           text;
alter table equipment add column if not exists din_ref              text;
alter table equipment add column if not exists ist_behaelter        boolean;
alter table equipment add column if not exists typischer_container  text;

-- Activity rule data (difficulty + Tabu-Wörter), keyed by equipment id. Kept out
-- of `equipment` because that table is mode-agnostic domain data (ADR-0004 layer
-- 1) while this is game rules. Equipment with no row here is simply not playable
-- in Activity. Shared read-only reference like vehicle_types; seeded via seed.sql.
create table if not exists activity_cards (
  equipment_id  text primary key references equipment (id) on delete cascade,
  difficulty    text not null check (difficulty in ('Leicht', 'Mittel', 'Schwer')),
  taboo         text[],
  exclude_modes text[]
);

create table if not exists vehicles (
  id       text primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name     text not null,
  type_id  text not null references vehicle_types (id)
);

create table if not exists placements (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_id     text not null references vehicles (id) on delete cascade,
  compartment_id text not null,
  equipment_id   text not null,
  qty            int
);

create index if not exists placements_owner_idx on placements (owner_id);
create index if not exists placements_vehicle_idx on placements (vehicle_id);

alter table equipment      enable row level security;
alter table activity_cards enable row level security;
alter table vehicles       enable row level security;
alter table placements     enable row level security;

-- Activity cards are shared rules, readable by everyone; never written via the
-- anon key (same posture as vehicle_types).
drop policy if exists activity_cards_read on activity_cards;
create policy activity_cards_read on activity_cards
  for select using (true);

-- Equipment: shared seed (owner_id null) is world-readable; own custom items too.
-- Writes stay owner-scoped, so the shared catalog is immutable via the anon key.
drop policy if exists equipment_read on equipment;
create policy equipment_read on equipment
  for select using (owner_id is null or owner_id = auth.uid());
drop policy if exists equipment_insert on equipment;
create policy equipment_insert on equipment
  for insert with check (owner_id = auth.uid());
drop policy if exists equipment_update on equipment;
create policy equipment_update on equipment
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists equipment_delete on equipment;
create policy equipment_delete on equipment
  for delete using (owner_id = auth.uid());

-- "Own your Library": each owner sees and mutates only their own rows.
drop policy if exists vehicles_owner on vehicles;
create policy vehicles_owner on vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists placements_owner on placements;
create policy placements_owner on placements
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed the shared reference data (vehicle types + DIN equipment catalog) by
-- running docs/supabase/seed.sql next. Both seed.sql and core/seed/seed-lf.ts are
-- generated from docs/research/*.csv (npm run gen:seed), so the app's local seed
-- and the database stay identical.
