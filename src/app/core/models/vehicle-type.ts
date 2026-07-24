import { Compartment, CompartmentId } from './compartment';

/** A default DIN placement: equipment lives in a compartment (type-level template). */
export interface DefaultPlacement {
  compartmentId: CompartmentId;
  equipmentId: string;
  qty?: number;
}

/**
 * A DIN vehicle type. Owns the fixed compartment layout and the normative
 * default loadout. Ships as seed content; cloned into Vehicle instances
 * (clone-on-create, ADR-0001). Not edited by end users in v1.
 *
 * Beyond the playable/loadout-bearing types, the seed also carries the full
 * German Feuerwehr vehicle master data (Fahrzeugkatalog) grouped by taktische
 * Ordnungsnummer 10–90. Catalog-only types ship with empty `compartments` /
 * `defaultLoadout` stubs and are populated with verified DIN loadouts over time.
 * The `?`-fields below are the master-data metadata; they are absent on the
 * hand-authored LF today and present on every catalog entry.
 */
export interface VehicleType {
  id: string;
  /** Kurzbezeichnung, e.g. "LF 20". */
  name: string;
  compartments: Compartment[];
  defaultLoadout: DefaultPlacement[];
  /** True when a hand-crafted schematic exists (v1: the LF via LfSketch). */
  hasCustomSketch?: boolean;

  // --- Fahrzeugkatalog master data (all optional) ---------------------------
  /** Ausgeschriebener Name, e.g. "Löschgruppenfahrzeug 20". */
  langbezeichnung?: string;
  /** Taktische Ordnungsnummerngruppe, e.g. "40" (Löschgruppen-/TS-Fahrzeuge). */
  ordnungsnummer?: string;
  /** Klartext der Ordnungsnummerngruppe, e.g. "Löschgruppen- und Tragkraftspritzenfahrzeuge". */
  klasse?: string;
  /** Feinere Gattung innerhalb der Klasse, e.g. "Löschgruppenfahrzeug". */
  kategorie?: string;
  /** Gängige Kurzformen / alternative Bezeichnungen. */
  synonyms?: string[];
  /** Feuerlöschpumpe, e.g. "FPN 10-2000". */
  pumpe?: string;
  /** Normbesatzung im Format Truppführer/… , e.g. "Gruppe (0/1/8/9)". */
  besatzung?: string;
  /** Zulässige Gesamtmasse, e.g. "16 t". */
  gesamtmasse?: string;
  /** Löschwassertank, e.g. "2000 l" (leer wenn kein Tank). */
  loeschwasser?: string;
  /** Hauptaufgabe(n), e.g. "Brandbekämpfung / Technische Hilfeleistung". */
  hauptaufgabe?: string;
  /** Zugrunde liegende Norm, e.g. "DIN 14530-11". */
  dinRef?: string;
  /** Antriebsart, e.g. "Allrad" oder "Straße". */
  antrieb?: string;
  /** Erklärender Fließtext für die Fahrzeugkunde. */
  beschreibung?: string;
  /** Typischer Einsatz / taktische Verwendung. */
  verwendung?: string;
}
