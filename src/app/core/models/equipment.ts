/** A canonical piece of equipment in the shared catalog (no free text). */
export interface Equipment {
  id: string;
  name: string;
  /** Loose grouping (e.g. 'Rettung', 'Brandbekämpfung', 'Technische Hilfe'). */
  category?: string;
}
