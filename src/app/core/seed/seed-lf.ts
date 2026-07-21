import { VehicleType, DefaultPlacement } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Compartment } from '../models/compartment';

/**
 * Seed content for Fabian's LF (v1's single vehicle type). The compartment ids
 * MUST match the zone ids in shared/lf-sketch.ts.
 *
 * ⚠️ PROVISIONAL: this is a plausible DIN 14530-11 LF-20 loadout for bootstrapping.
 * Verify against the real truck before trusting it in a live Übung.
 */

export const LF_COMPARTMENTS: Compartment[] = [
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

const eq = (id: string, name: string, category: string): Equipment => ({ id, name, category });

export const SEED_EQUIPMENT: Equipment[] = [
  // Wasserführende Armaturen
  eq('verteiler', 'Verteiler B-CBC', 'Wasserführend'),
  eq('standrohr', 'Standrohr', 'Wasserführend'),
  eq('sammelstueck', 'Sammelstück A-BB', 'Wasserführend'),
  eq('stuetzkruemmer', 'Stützkrümmer', 'Wasserführend'),
  eq('hohlstrahlrohr', 'Hohlstrahlrohr C', 'Wasserführend'),
  eq('strahlrohr-c', 'C-Strahlrohr', 'Wasserführend'),
  eq('strahlrohr-b', 'B-Strahlrohr', 'Wasserführend'),
  eq('kuebelspritze', 'Kübelspritze', 'Wasserführend'),
  eq('zumischer', 'Zumischer Z4', 'Wasserführend'),
  eq('schaumrohr', 'Schaumrohr M4', 'Wasserführend'),
  eq('schaummittel', 'Schaummittel-Kanister', 'Wasserführend'),
  // Schläuche
  eq('c-schlauch', 'C-Druckschläuche', 'Schläuche'),
  eq('b-schlauch', 'B-Druckschläuche', 'Schläuche'),
  eq('saugschlauch', 'A-Saugschläuche', 'Schläuche'),
  eq('schlauchbruecke', 'Schlauchbrücke', 'Schläuche'),
  // Hydrantenzubehör
  eq('unterflurschluessel', 'Unterflurhydrantenschlüssel', 'Wasserentnahme'),
  eq('ueberflurschluessel', 'Überflurhydrantenschlüssel', 'Wasserentnahme'),
  eq('kupplungsschluessel', 'Kupplungsschlüssel ABC', 'Wasserentnahme'),
  eq('mehrzweckleine', 'Mehrzweckleine / Ventilleine', 'Wasserentnahme'),
  // Atemschutz
  eq('pressluftatmer', 'Pressluftatmer (PA)', 'Atemschutz'),
  eq('ersatzflasche', 'Ersatz-Atemluftflaschen', 'Atemschutz'),
  eq('fluchthaube', 'Fluchthaube', 'Atemschutz'),
  eq('ueberwachungstafel', 'Atemschutzüberwachungstafel', 'Atemschutz'),
  // Elektro / Beleuchtung
  eq('stromerzeuger', 'Tragbarer Stromerzeuger', 'Elektro'),
  eq('flutlichtstrahler', 'Flutlichtstrahler', 'Elektro'),
  eq('kabeltrommel', 'Kabeltrommel', 'Elektro'),
  eq('handlampe', 'Handscheinwerfer (Ex)', 'Elektro'),
  // Technische Hilfe
  eq('motorsaege', 'Motorsäge', 'Technische Hilfe'),
  eq('trennschleifer', 'Trennschleifer', 'Technische Hilfe'),
  eq('bolzenschneider', 'Bolzenschneider', 'Technische Hilfe'),
  eq('brechstange', 'Brechstange / Halligan', 'Technische Hilfe'),
  eq('werkzeugkasten', 'Werkzeugkasten', 'Technische Hilfe'),
  eq('einreisshaken', 'Einreißhaken', 'Technische Hilfe'),
  // Leitern
  eq('steckleiter', 'Steckleiter', 'Leitern'),
  eq('multifunktionsleiter', 'Multifunktionsleiter', 'Leitern'),
  // Rettung / Sanität
  eq('krankentrage', 'Krankentrage', 'Rettung'),
  eq('sanitaetskasten', 'Sanitätskasten', 'Rettung'),
  eq('feuerwehrleine', 'Feuerwehrleine', 'Rettung'),
  // Absicherung / Fahrerraum
  eq('verkehrsleitkegel', 'Verkehrsleitkegel', 'Absicherung'),
  eq('warndreieck', 'Warndreieck & Warnleuchte', 'Absicherung'),
  eq('handfunkgeraet', 'Handsprechfunkgeräte', 'Kommunikation'),
  eq('feuerloescher', 'Pulverlöscher PG12', 'Brandbekämpfung'),
];

const p = (compartmentId: DefaultPlacement['compartmentId'], equipmentId: string): DefaultPlacement => ({
  compartmentId,
  equipmentId,
});

export const LF_DEFAULT_LOADOUT: DefaultPlacement[] = [
  // Fahrerkabine
  p('Fahrerkabine', 'handfunkgeraet'),
  p('Fahrerkabine', 'handlampe'),
  // G1 — Wasserführung / Hydranten
  p('G1', 'verteiler'),
  p('G1', 'standrohr'),
  p('G1', 'unterflurschluessel'),
  p('G1', 'ueberflurschluessel'),
  p('G1', 'kuebelspritze'),
  p('G1', 'mehrzweckleine'),
  // G2 — Atemschutz
  p('G2', 'pressluftatmer'),
  p('G2', 'ersatzflasche'),
  p('G2', 'ueberwachungstafel'),
  p('G2', 'fluchthaube'),
  // G3 — Elektro / Beleuchtung
  p('G3', 'stromerzeuger'),
  p('G3', 'flutlichtstrahler'),
  p('G3', 'kabeltrommel'),
  p('G3', 'feuerloescher'),
  // G4 — Technische Hilfe
  p('G4', 'motorsaege'),
  p('G4', 'trennschleifer'),
  p('G4', 'bolzenschneider'),
  p('G4', 'brechstange'),
  p('G4', 'werkzeugkasten'),
  // G5 — Schläuche / Kupplungen
  p('G5', 'b-schlauch'),
  p('G5', 'c-schlauch'),
  p('G5', 'sammelstueck'),
  p('G5', 'kupplungsschluessel'),
  // G6 — Wasserführende Armaturen
  p('G6', 'hohlstrahlrohr'),
  p('G6', 'strahlrohr-c'),
  p('G6', 'strahlrohr-b'),
  p('G6', 'stuetzkruemmer'),
  p('G6', 'zumischer'),
  p('G6', 'schaumrohr'),
  p('G6', 'schaummittel'),
  // Angriffstrupp (crew) — sofort einsatzbereites Atemschutz
  p('Angriffstrupp', 'pressluftatmer'),
  // Bank hinten
  p('Bank hinten', 'pressluftatmer'),
  // Dach
  p('Dach', 'steckleiter'),
  p('Dach', 'multifunktionsleiter'),
  p('Dach', 'saugschlauch'),
  p('Dach', 'schlauchbruecke'),
  p('Dach', 'einreisshaken'),
  p('Dach', 'krankentrage'),
  p('Dach', 'verkehrsleitkegel'),
  p('Dach', 'warndreieck'),
];

export const LF_VEHICLE_TYPE: VehicleType = {
  id: 'lf-fabian',
  name: 'LF (Fabians Fahrzeug)',
  compartments: LF_COMPARTMENTS,
  defaultLoadout: LF_DEFAULT_LOADOUT,
  hasCustomSketch: true,
};

export const SEED_VEHICLE_TYPES: VehicleType[] = [LF_VEHICLE_TYPE];
