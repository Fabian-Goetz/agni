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

alter table vehicle_types enable row level security;

-- Everyone (authenticated) may read the shared catalog; nobody writes via anon key.
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

alter table equipment  enable row level security;
alter table vehicles   enable row level security;
alter table placements enable row level security;

-- Equipment: shared seed (owner_id null) is world-readable; own custom items too.
-- Writes stay owner-scoped, so the shared catalog is immutable via the anon key.
create policy equipment_read on equipment
  for select using (owner_id is null or owner_id = auth.uid());
create policy equipment_insert on equipment
  for insert with check (owner_id = auth.uid());
create policy equipment_update on equipment
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy equipment_delete on equipment
  for delete using (owner_id = auth.uid());

-- "Own your Library": each owner sees and mutates only their own rows.
create policy vehicles_owner on vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy placements_owner on placements
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed the shared reference data (vehicle types + DIN equipment catalog) by
-- running docs/supabase/seed.sql next. It is generated from core/seed/seed-lf.ts
-- so the app's local seed and the database stay identical.
