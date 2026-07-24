// Generates the app seed from the research CSVs — single source of truth.
//   npm run gen:seed
// Emits:
//   - src/app/core/seed/seed-lf.ts     (typed, imported by the local adapter)
//   - docs/supabase/seed.sql           (idempotent upserts for Supabase)
// Re-run whenever docs/research/*.csv change.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = join(ROOT, 'docs/research');

// ---- CSV ------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}
const csv = (name) => parseCsv(readFileSync(join(RESEARCH, name), 'utf8'));

// ---- helpers --------------------------------------------------------------
const slug = (s) =>
  s.toLowerCase().replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---- equipment catalog ----------------------------------------------------
const catalog = csv('geraete-katalog-v1.csv');
const idByName = new Map();
const equipment = catalog.map((r) => {
  const id = slug(r.name);
  idByName.set(r.name, id);
  const e = { id, name: r.name };
  if (r.kategorie) e.category = r.kategorie;
  if (r.unterkategorie) e.subcategory = r.unterkategorie;
  const syn = r.synonyme ? r.synonyme.split(';').map((s) => s.trim()).filter(Boolean) : [];
  if (syn.length) e.synonyms = syn;
  if (r.kurzzeichen) e.kurzzeichen = r.kurzzeichen;
  if (r.beschreibung) e.beschreibung = r.beschreibung;
  if (r.verwendung) e.verwendung = r.verwendung;
  if (r.din_ref) e.dinRef = r.din_ref;
  if (r['ist_behälter'] === 'ja') e.istBehaelter = true;
  if (r.typischer_container) e.typischerContainer = r.typischer_container;
  return e;
});
{
  const seen = new Set();
  for (const e of equipment) {
    if (seen.has(e.id)) throw new Error(`duplicate equipment slug: ${e.id}`);
    seen.add(e.id);
  }
}

// ---- LF 20 (playable): reconcile the DIN loadout onto the LfSketch zones ----
// The zones MUST match shared/lf-sketch.ts / LF_COMPARTMENT_IDS.
const LF_COMPARTMENTS = [
  { id: 'Fahrerkabine', label: 'Fahrerkabine', side: 'cabin', order: 0 },
  { id: 'G1', label: 'G1', side: 'left', order: 1 },
  { id: 'G3', label: 'G3', side: 'left', order: 2 },
  { id: 'G5', label: 'G5', side: 'left', order: 3 },
  { id: 'G2', label: 'G2', side: 'right', order: 1 },
  { id: 'G4', label: 'G4', side: 'right', order: 2 },
  { id: 'G6', label: 'G6', side: 'right', order: 3 },
  { id: 'Angriffstrupp', label: 'Angriffstrupp', side: 'cabin', order: 4 },
  { id: 'Bank hinten', label: 'Bank hinten', side: 'cabin', order: 5 },
  { id: 'Dach', label: 'Dach', side: 'roof', order: 1 },
];
// Explicit catalog-name → LF zone map (null = not placed: fest eingebaut / excluded).
const LF_FACH = {
  'Feuerlöschkreiselpumpe': null, 'Schnellangriffseinrichtung': null, 'Rettungssatz': null,
  'Saugschlauch A': 'Dach', 'Druckschlauch B': 'G5', 'Druckschlauch C': 'G5', 'Druckschlauch D': 'G5',
  'Verteiler': 'G1', 'Sammelstück': 'G5', 'Standrohr': 'G1', 'Übergangsstück': 'G1',
  'Stützkrümmer': 'G6', 'Saugkorb': 'Dach', 'Kupplungsschlüssel ABC': 'G1',
  'Unterflurhydrantenschlüssel': 'G1', 'Schlauchtragekorb': 'G5', 'Schlauchbrücke': 'G5',
  'Mehrzweckstrahlrohr C': 'G6', 'Mehrzweckstrahlrohr B': 'G6', 'Hohlstrahlrohr': 'G6',
  'Zumischer': 'G6', 'Mittelschaumrohr': 'G6', 'Schwerschaumrohr': 'G6', 'Schaummittelkanister': 'G6',
  'Kübelspritze': 'G1', 'Pulverlöscher': 'G3', 'Kohlendioxidlöscher': 'G1',
  'Steckleiter': 'Dach', 'Multifunktionsleiter': 'Dach', 'Klappleiter': 'Dach',
  'Feuerwehrleine': 'Angriffstrupp', 'Mehrzweckleine': 'G1', 'Rettungstuch': 'Dach',
  'Pressluftatmer': 'G2', 'Atemluftflasche': 'G2', 'Atemschutzmaske': 'G2',
  'Fluchthaube': 'G2', 'Atemschutzüberwachungstafel': 'G2', 'Wärmebildkamera': 'G2',
  'Stromerzeuger': 'G3', 'Flutlichtstrahler': 'G3', 'Beleuchtungsstativ': 'G3', 'Kabeltrommel': 'G3',
  'Handscheinwerfer': 'Fahrerkabine',
  'Verkehrssicherungskoffer': 'Dach', 'Verkehrsleitkegel': 'Dach', 'Warnblitzleuchte': 'Dach',
  'Werkzeugkoffer': 'G4', 'Motorsäge': 'G4', 'Trennschleifer': 'G4', 'Säbelsäge': 'G4',
  'Tauchpumpe TP 4': 'G4', 'Überdrucklüfter': 'G4', 'Kaminkehrgerät': 'G4',
  'Bolzenschneider': 'G4', 'Brechstange': 'G4', 'Spaten': 'G4', 'Rettungsaxt': 'G4', 'Feuerwehreimer': 'G4',
  'Verbandkasten': 'Angriffstrupp', 'Rettungsdecke': 'Angriffstrupp',
  'Ölbindemittel': 'G4', 'Auffangbehälter': 'G4',
};

function loadoutPlacements(file, mapFach) {
  const seen = new Set();
  const out = [];
  for (const r of csv(file)) {
    if (r.pflicht === 'nicht enthalten') continue;
    const menge = parseInt(r.menge, 10);
    if (!Number.isFinite(menge) || menge <= 0) continue;
    const comp = mapFach(r.geraet, r.typischer_geraeteraum);
    if (!comp) continue;
    const eqId = idByName.get(r.geraet);
    if (!eqId) throw new Error(`${file}: '${r.geraet}' not found in the equipment catalog`);
    const key = `${comp}|${eqId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const p = { compartmentId: comp, equipmentId: eqId };
    if (menge > 1) p.qty = menge;
    out.push(p);
  }
  return out;
}

const lfMap = (name) => {
  if (!(name in LF_FACH)) throw new Error(`LF loadout: no zone mapping for '${name}'`);
  return LF_FACH[name];
};
const lfLoadout = loadoutPlacements('lf20-loadout-din14530.csv', lfMap);
// Ready-to-go breathing apparatus at the crew seats (mirrors the hand seed).
lfLoadout.push(
  { compartmentId: 'Angriffstrupp', equipmentId: idByName.get('Pressluftatmer') },
  { compartmentId: 'Bank hinten', equipmentId: idByName.get('Pressluftatmer') },
);

// ---- loadout-bearing types (HLF/TLF/TSF): their own Fächer, drawn by the -------
// generic metadata renderer (ADR-0003) rather than a hand-crafted sketch.
const sideFor = (id) =>
  id === 'Dach' ? 'roof' : id === 'Mannschaftsraum' || id === 'Fahrerkabine' ? 'cabin'
    : /[13579]$/.test(id) ? 'left' : /[2468]$/.test(id) ? 'right' : 'left';
const identityMap = (_name, fach) => (fach && fach !== 'Heck' && fach !== '-' ? fach : null);

/**
 * Front→rear rank of a compartment within its side. DIN numbers the Geräteräume
 * front to rear with odd on the left and even on the right (G1/G2 front, G3/G4
 * middle, G5/G6 rear), so the pair number is the rank. Everything else (cabin,
 * Dach) is a single compartment per type and sorts first. The renderer lays a
 * side out by this order, so a CSV-encounter index would draw the truck backwards.
 */
const orderFor = (id) => {
  const g = /^G(\d+)$/.exec(id);
  return g ? Math.ceil(Number(g[1]) / 2) : 1;
};
const SIDE_RANK = { cabin: 0, left: 1, right: 2, roof: 3, rear: 4 };

function listOnlyLoadout(file) {
  const loadout = loadoutPlacements(file, identityMap);
  const ids = [];
  for (const p of loadout) if (!ids.includes(p.compartmentId)) ids.push(p.compartmentId);
  const compartments = ids
    .map((cid) => ({ id: cid, label: cid, side: sideFor(cid), order: orderFor(cid) }))
    .sort((a, b) => SIDE_RANK[a.side] - SIDE_RANK[b.side] || a.order - b.order);
  return { compartments, defaultLoadout: loadout, hasCustomSketch: false };
}

// The verified DIN loadouts, keyed by catalog id. Types not listed here are
// catalog-only master data and ship with empty compartment/loadout stubs until
// a hand-verified loadout CSV is added.
const LOADOUTS = {
  'lf-20': { compartments: LF_COMPARTMENTS, defaultLoadout: lfLoadout, hasCustomSketch: true },
  'hlf-20': listOnlyLoadout('hlf20-loadout-din14530-27.csv'),
  'tlf-3000': listOnlyLoadout('tlf3000-loadout-din14530-22.csv'),
  'tsf-w': listOnlyLoadout('tsfw-loadout-din14530-17.csv'),
};

// ---- vehicle master data (Fahrzeugkatalog, taktische Ordnungsnummer 10–90) ---
const fahrzeuge = csv('fahrzeug-katalog-v1.csv');
{
  const seen = new Set();
  for (const r of fahrzeuge) {
    if (!r.id) throw new Error('fahrzeug-katalog: row without id');
    if (seen.has(r.id)) throw new Error(`duplicate vehicle id: ${r.id}`);
    seen.add(r.id);
  }
  for (const id of Object.keys(LOADOUTS))
    if (!seen.has(id)) throw new Error(`LOADOUTS id '${id}' missing from fahrzeug-katalog-v1.csv`);
}

const SEED_VEHICLE_TYPES = fahrzeuge
  .map((r) => {
    const load = LOADOUTS[r.id] ?? { compartments: [], defaultLoadout: [], hasCustomSketch: false };
    const t = {
      id: r.id,
      name: r.kurzbezeichnung,
      compartments: load.compartments,
      defaultLoadout: load.defaultLoadout,
      hasCustomSketch: load.hasCustomSketch,
    };
    if (r.langbezeichnung) t.langbezeichnung = r.langbezeichnung;
    if (r.ordnungsnummer) t.ordnungsnummer = r.ordnungsnummer;
    if (r.klasse) t.klasse = r.klasse;
    if (r.kategorie) t.kategorie = r.kategorie;
    const syn = r.synonyme ? r.synonyme.split(';').map((s) => s.trim()).filter(Boolean) : [];
    if (syn.length) t.synonyms = syn;
    if (r.pumpe) t.pumpe = r.pumpe;
    if (r.besatzung) t.besatzung = r.besatzung;
    if (r.gesamtmasse) t.gesamtmasse = r.gesamtmasse;
    if (r.loeschwasser) t.loeschwasser = r.loeschwasser;
    if (r.hauptaufgabe) t.hauptaufgabe = r.hauptaufgabe;
    if (r.din_ref) t.dinRef = r.din_ref;
    if (r.antrieb) t.antrieb = r.antrieb;
    if (r.beschreibung) t.beschreibung = r.beschreibung;
    if (r.verwendung) t.verwendung = r.verwendung;
    return t;
  })
  // Group by taktische Ordnungsnummer (10 → 90); stable within a group.
  .sort((a, b) => (parseInt(a.ordnungsnummer || '0', 10) - parseInt(b.ordnungsnummer || '0', 10)));

const LF_VEHICLE_TYPE = SEED_VEHICLE_TYPES.find((t) => t.id === 'lf-20');
if (!LF_VEHICLE_TYPE) throw new Error("catalog must contain the playable 'lf-20' type");

// ---- emit TS --------------------------------------------------------------
const banner = `// AUTO-GENERATED by scripts/generate-seed.mjs from docs/research/*.csv.\n// Do not edit by hand — run \`npm run gen:seed\` after changing the CSVs.\n`;
const ts = `${banner}import { Equipment } from '../models/equipment';
import { VehicleType } from '../models/vehicle-type';
import { Compartment } from '../models/compartment';

export const SEED_EQUIPMENT: Equipment[] = ${JSON.stringify(equipment, null, 2)};

export const LF_COMPARTMENTS: Compartment[] = ${JSON.stringify(LF_COMPARTMENTS, null, 2)};

export const SEED_VEHICLE_TYPES: VehicleType[] = ${JSON.stringify(SEED_VEHICLE_TYPES, null, 2)};

export const LF_VEHICLE_TYPE: VehicleType =
  SEED_VEHICLE_TYPES.find((t) => t.id === 'lf-20')!;
export const LF_DEFAULT_LOADOUT = LF_VEHICLE_TYPE.defaultLoadout;
`;
writeFileSync(join(ROOT, 'src/app/core/seed/seed-lf.ts'), ts);

// ---- emit SQL -------------------------------------------------------------
const s = (v) => (v == null || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `array[${a.map(s).join(', ')}]` : 'null');
const jb = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;
const bool = (b) => (b ? 'true' : 'null');

const vtRows = SEED_VEHICLE_TYPES.map(
  (t) => `  (${s(t.id)}, ${s(t.name)}, ${jb(t.compartments)}, ${jb(t.defaultLoadout)}, ${t.hasCustomSketch ? 'true' : 'false'}, ` +
    `${s(t.langbezeichnung)}, ${s(t.ordnungsnummer)}, ${s(t.klasse)}, ${s(t.kategorie)}, ${arr(t.synonyms)}, ` +
    `${s(t.pumpe)}, ${s(t.besatzung)}, ${s(t.gesamtmasse)}, ${s(t.loeschwasser)}, ${s(t.hauptaufgabe)}, ` +
    `${s(t.dinRef)}, ${s(t.antrieb)}, ${s(t.beschreibung)}, ${s(t.verwendung)})`,
).join(',\n');
const eqRows = equipment.map(
  (e) => `  (${s(e.id)}, null, ${s(e.name)}, ${s(e.category)}, ${arr(e.synonyms)}, ${s(e.subcategory)}, ${s(e.kurzzeichen)}, ${s(e.beschreibung)}, ${s(e.verwendung)}, ${s(e.dinRef)}, ${bool(e.istBehaelter)}, ${s(e.typischerContainer)})`,
).join(',\n');

const sql = `-- ==========================================================================
-- SEED (run once, in the Supabase SQL editor, after schema.sql).
-- AUTO-GENERATED by scripts/generate-seed.mjs from docs/research/*.csv — do not edit.
-- Shared reference rows: vehicle_types + the DIN equipment catalog (owner_id null).
-- ==========================================================================

insert into vehicle_types (
  id, name, compartments, default_loadout, has_custom_sketch,
  langbezeichnung, ordnungsnummer, klasse, kategorie, synonyms,
  pumpe, besatzung, gesamtmasse, loeschwasser, hauptaufgabe,
  din_ref, antrieb, beschreibung, verwendung
) values
${vtRows}
on conflict (id) do update set
  name = excluded.name,
  compartments = excluded.compartments,
  default_loadout = excluded.default_loadout,
  has_custom_sketch = excluded.has_custom_sketch,
  langbezeichnung = excluded.langbezeichnung,
  ordnungsnummer = excluded.ordnungsnummer,
  klasse = excluded.klasse,
  kategorie = excluded.kategorie,
  synonyms = excluded.synonyms,
  pumpe = excluded.pumpe,
  besatzung = excluded.besatzung,
  gesamtmasse = excluded.gesamtmasse,
  loeschwasser = excluded.loeschwasser,
  hauptaufgabe = excluded.hauptaufgabe,
  din_ref = excluded.din_ref,
  antrieb = excluded.antrieb,
  beschreibung = excluded.beschreibung,
  verwendung = excluded.verwendung;

insert into equipment (id, owner_id, name, category, synonyms, subcategory, kurzzeichen, beschreibung, verwendung, din_ref, ist_behaelter, typischer_container) values
${eqRows}
on conflict (id) do update set
  name = excluded.name, category = excluded.category, synonyms = excluded.synonyms,
  subcategory = excluded.subcategory, kurzzeichen = excluded.kurzzeichen,
  beschreibung = excluded.beschreibung, verwendung = excluded.verwendung,
  din_ref = excluded.din_ref, ist_behaelter = excluded.ist_behaelter,
  typischer_container = excluded.typischer_container;
`;
writeFileSync(join(ROOT, 'docs/supabase/seed.sql'), sql);

console.log(`seed generated: ${equipment.length} equipment, ${SEED_VEHICLE_TYPES.length} vehicle types (LF placements: ${lfLoadout.length})`);
