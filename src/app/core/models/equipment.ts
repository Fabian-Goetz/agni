/** A canonical piece of equipment in the shared catalog (no free text). */
export interface Equipment {
  id: string;
  name: string;
  /** Top-level grouping (e.g. 'Brandbekämpfung', 'Technische Hilfeleistung'). */
  category?: string;
  /** Finer grouping within the category. */
  subcategory?: string;
  /** Alternative / colloquial names (Synonyme). */
  synonyms?: string[];
  /** Norm short code (e.g. 'PA', 'CSA', 'CM'). */
  kurzzeichen?: string;
  /** Educational "what is it" — shown in the Geräte-Katalog. */
  beschreibung?: string;
  /** Educational "what is it for" — shown in the Geräte-Katalog. */
  verwendung?: string;
  /** DIN/EN reference where known (best-effort). */
  dinRef?: string;
  /** True when this item is itself a container/set holding other Geräte. */
  istBehaelter?: boolean;
  /** The container this item usually sits in (soft, non-exclusive). */
  typischerContainer?: string;
}
