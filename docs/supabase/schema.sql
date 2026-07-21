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
create table if not exists equipment (
  id       text primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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

-- "Own your Library": each owner sees and mutates only their own rows.
create policy equipment_owner on equipment
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy vehicles_owner on vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy placements_owner on placements
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed the shared vehicle type once (privileged / service-role context).
-- The app ships the same seed locally (core/seed/seed-lf.ts); insert the LF
-- type here so authenticated users can clone it. Example:
--
--   insert into vehicle_types (id, name, compartments, default_loadout, has_custom_sketch)
--   values ('lf-fabian', 'LF (Fabians Fahrzeug)', '[...]'::jsonb, '[...]'::jsonb, true)
--   on conflict (id) do update set
--     name = excluded.name,
--     compartments = excluded.compartments,
--     default_loadout = excluded.default_loadout,
--     has_custom_sketch = excluded.has_custom_sketch;
