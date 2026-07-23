-- ==========================================================================
-- SEED (run once, in the Supabase SQL editor, after schema.sql).
-- Generated from src/app/core/seed/seed-lf.ts — regenerate if the seed changes.
-- Shared reference rows: vehicle_types + the DIN equipment catalog (owner_id null).
-- ==========================================================================

insert into vehicle_types (id, name, compartments, default_loadout, has_custom_sketch) values
  ('lf-fabian', 'LF (Fabians Fahrzeug)', '[{"id":"Fahrerkabine","label":"Fahrerkabine","side":"cabin","order":0},{"id":"G1","label":"G1","side":"left","order":1},{"id":"G3","label":"G3","side":"left","order":2},{"id":"G5","label":"G5","side":"left","order":3},{"id":"G2","label":"G2","side":"right","order":1},{"id":"G4","label":"G4","side":"right","order":2},{"id":"G6","label":"G6","side":"right","order":3},{"id":"Angriffstrupp","label":"Angriffstrupp","side":"cabin","order":4},{"id":"Bank hinten","label":"Bank hinten","side":"cabin","order":5},{"id":"Dach","label":"Dach","side":"roof","order":1}]'::jsonb, '[{"compartmentId":"Fahrerkabine","equipmentId":"handfunkgeraet"},{"compartmentId":"Fahrerkabine","equipmentId":"handlampe"},{"compartmentId":"G1","equipmentId":"verteiler"},{"compartmentId":"G1","equipmentId":"standrohr"},{"compartmentId":"G1","equipmentId":"unterflurschluessel"},{"compartmentId":"G1","equipmentId":"ueberflurschluessel"},{"compartmentId":"G1","equipmentId":"kuebelspritze"},{"compartmentId":"G1","equipmentId":"mehrzweckleine"},{"compartmentId":"G2","equipmentId":"pressluftatmer"},{"compartmentId":"G2","equipmentId":"ersatzflasche"},{"compartmentId":"G2","equipmentId":"ueberwachungstafel"},{"compartmentId":"G2","equipmentId":"fluchthaube"},{"compartmentId":"G3","equipmentId":"stromerzeuger"},{"compartmentId":"G3","equipmentId":"flutlichtstrahler"},{"compartmentId":"G3","equipmentId":"kabeltrommel"},{"compartmentId":"G3","equipmentId":"feuerloescher"},{"compartmentId":"G4","equipmentId":"motorsaege"},{"compartmentId":"G4","equipmentId":"trennschleifer"},{"compartmentId":"G4","equipmentId":"bolzenschneider"},{"compartmentId":"G4","equipmentId":"brechstange"},{"compartmentId":"G4","equipmentId":"werkzeugkasten"},{"compartmentId":"G5","equipmentId":"b-schlauch"},{"compartmentId":"G5","equipmentId":"c-schlauch"},{"compartmentId":"G5","equipmentId":"sammelstueck"},{"compartmentId":"G5","equipmentId":"kupplungsschluessel"},{"compartmentId":"G6","equipmentId":"hohlstrahlrohr"},{"compartmentId":"G6","equipmentId":"strahlrohr-c"},{"compartmentId":"G6","equipmentId":"strahlrohr-b"},{"compartmentId":"G6","equipmentId":"stuetzkruemmer"},{"compartmentId":"G6","equipmentId":"zumischer"},{"compartmentId":"G6","equipmentId":"schaumrohr"},{"compartmentId":"G6","equipmentId":"schaummittel"},{"compartmentId":"Angriffstrupp","equipmentId":"pressluftatmer"},{"compartmentId":"Bank hinten","equipmentId":"pressluftatmer"},{"compartmentId":"Dach","equipmentId":"steckleiter"},{"compartmentId":"Dach","equipmentId":"multifunktionsleiter"},{"compartmentId":"Dach","equipmentId":"saugschlauch"},{"compartmentId":"Dach","equipmentId":"schlauchbruecke"},{"compartmentId":"Dach","equipmentId":"einreisshaken"},{"compartmentId":"Dach","equipmentId":"krankentrage"},{"compartmentId":"Dach","equipmentId":"verkehrsleitkegel"},{"compartmentId":"Dach","equipmentId":"warndreieck"}]'::jsonb, true)
on conflict (id) do update set
  name = excluded.name,
  compartments = excluded.compartments,
  default_loadout = excluded.default_loadout,
  has_custom_sketch = excluded.has_custom_sketch;

insert into equipment (id, owner_id, name, category) values
  ('verteiler', null, 'Verteiler B-CBC', 'Wasserführend'),
  ('standrohr', null, 'Standrohr', 'Wasserführend'),
  ('sammelstueck', null, 'Sammelstück A-BB', 'Wasserführend'),
  ('stuetzkruemmer', null, 'Stützkrümmer', 'Wasserführend'),
  ('hohlstrahlrohr', null, 'Hohlstrahlrohr C', 'Wasserführend'),
  ('strahlrohr-c', null, 'C-Strahlrohr', 'Wasserführend'),
  ('strahlrohr-b', null, 'B-Strahlrohr', 'Wasserführend'),
  ('kuebelspritze', null, 'Kübelspritze', 'Wasserführend'),
  ('zumischer', null, 'Zumischer Z4', 'Wasserführend'),
  ('schaumrohr', null, 'Schaumrohr M4', 'Wasserführend'),
  ('schaummittel', null, 'Schaummittel-Kanister', 'Wasserführend'),
  ('c-schlauch', null, 'C-Druckschläuche', 'Schläuche'),
  ('b-schlauch', null, 'B-Druckschläuche', 'Schläuche'),
  ('saugschlauch', null, 'A-Saugschläuche', 'Schläuche'),
  ('schlauchbruecke', null, 'Schlauchbrücke', 'Schläuche'),
  ('unterflurschluessel', null, 'Unterflurhydrantenschlüssel', 'Wasserentnahme'),
  ('ueberflurschluessel', null, 'Überflurhydrantenschlüssel', 'Wasserentnahme'),
  ('kupplungsschluessel', null, 'Kupplungsschlüssel ABC', 'Wasserentnahme'),
  ('mehrzweckleine', null, 'Mehrzweckleine / Ventilleine', 'Wasserentnahme'),
  ('pressluftatmer', null, 'Pressluftatmer (PA)', 'Atemschutz'),
  ('ersatzflasche', null, 'Ersatz-Atemluftflaschen', 'Atemschutz'),
  ('fluchthaube', null, 'Fluchthaube', 'Atemschutz'),
  ('ueberwachungstafel', null, 'Atemschutzüberwachungstafel', 'Atemschutz'),
  ('stromerzeuger', null, 'Tragbarer Stromerzeuger', 'Elektro'),
  ('flutlichtstrahler', null, 'Flutlichtstrahler', 'Elektro'),
  ('kabeltrommel', null, 'Kabeltrommel', 'Elektro'),
  ('handlampe', null, 'Handscheinwerfer (Ex)', 'Elektro'),
  ('motorsaege', null, 'Motorsäge', 'Technische Hilfe'),
  ('trennschleifer', null, 'Trennschleifer', 'Technische Hilfe'),
  ('bolzenschneider', null, 'Bolzenschneider', 'Technische Hilfe'),
  ('brechstange', null, 'Brechstange / Halligan', 'Technische Hilfe'),
  ('werkzeugkasten', null, 'Werkzeugkasten', 'Technische Hilfe'),
  ('einreisshaken', null, 'Einreißhaken', 'Technische Hilfe'),
  ('steckleiter', null, 'Steckleiter', 'Leitern'),
  ('multifunktionsleiter', null, 'Multifunktionsleiter', 'Leitern'),
  ('krankentrage', null, 'Krankentrage', 'Rettung'),
  ('sanitaetskasten', null, 'Sanitätskasten', 'Rettung'),
  ('feuerwehrleine', null, 'Feuerwehrleine', 'Rettung'),
  ('verkehrsleitkegel', null, 'Verkehrsleitkegel', 'Absicherung'),
  ('warndreieck', null, 'Warndreieck & Warnleuchte', 'Absicherung'),
  ('handfunkgeraet', null, 'Handsprechfunkgeräte', 'Kommunikation'),
  ('feuerloescher', null, 'Pulverlöscher PG12', 'Brandbekämpfung')
on conflict (id) do update set name = excluded.name, category = excluded.category;
