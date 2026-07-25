import { PerformMode } from '../models/activity-card';

/** A board field: either a mode to perform, or the goal. */
export type BoardCell = PerformMode | 'Ziel';

/**
 * The 36-field snake board, ported verbatim from the standalone Feuerwehr-Activity
 * app (itself ported from the FF-Konstanz colleague's Python original).
 *
 * It is not decoration: with mode-agnostic cards the **cell is what assigns the
 * mode**, so there is no "board off" switch — without it nothing would decide
 * Beschreiben vs. Zeichnen vs. Pantomime.
 */
export const DEFAULT_BOARD: BoardCell[] = [
  'Beschreiben', 'Zeichnen', 'Pantomime', 'Beschreiben', 'Pantomime', 'Zeichnen',
  'Zeichnen', 'Beschreiben', 'Pantomime', 'Zeichnen', 'Beschreiben', 'Pantomime',
  'Pantomime', 'Zeichnen', 'Beschreiben', 'Beschreiben', 'Pantomime', 'Zeichnen',
  'Beschreiben', 'Pantomime', 'Zeichnen', 'Pantomime', 'Beschreiben', 'Zeichnen',
  'Zeichnen', 'Pantomime', 'Beschreiben', 'Zeichnen', 'Beschreiben', 'Pantomime',
  'Beschreiben', 'Zeichnen', 'Pantomime', 'Beschreiben', 'Zeichnen', 'Ziel',
];
