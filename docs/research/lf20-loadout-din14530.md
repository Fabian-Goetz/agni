# LF 20 — Beladung nach DIN 14530-11 (verifizierter Stand)

Companion to [`lf20-loadout-din14530.csv`](./lf20-loadout-din14530.csv). Seeds the
**LF-20 Beladung** for the app's Fuhrpark/Werkbank (see
[screen-flow §7.3](../design/screen-flow.md)); each line maps to a row in
[`geraete-katalog-v1.csv`](./geraete-katalog-v1.csv) via the `geraet` name.

## What "verified" means here — and its limit

- **Verified (hoch):** the LF-20 headline specification, cross-checked against the
  German Wikipedia *Löschgruppenfahrzeug* article (a real, sighted secondary
  source) and DIN 14530-11 knowledge.
- **Not verified line-by-line:** the authoritative primary Beladelisten
  (Leistungsbeschreibungen of Brandenburg LSTE 2024, Bayern SFS, MV) are only
  available as **FlateDecode-compressed / scanned PDFs**, which could not be
  extracted to text in this environment. Individual **quantities** and
  **compartment (Fach) assignments** below are therefore **best-effort** and
  flagged `mittel`/`niedrig`.
- **Fach is not normed.** DIN 14530-11 prescribes the equipment *set and
  quantities*, **not** which Geräteraum each item sits in — that is
  manufacturer-/Aufbau-specific. `typischer_geraeteraum` is guidance for seeding
  only, always low confidence.

To upgrade this to a true line-by-line verification, provide a machine-readable
Beladeliste (CSV, DOCX, XLSX or plain text) and it can be reconciled item-by-item.

## Verified headline facts (DIN 14530-11)

| Merkmal | Wert | Quelle |
|---|---|---|
| Besatzung | 0/1/8/9 (Gruppe) | WP |
| Feuerlöschkreiselpumpe | FPN 10-2000 (fest eingebaut) | WP |
| Löschwasserbehälter | 2000 l | WP |
| Schaummittel | 6 × 20 l | WP |
| Löschpulver | 2 × 6 kg | WP |
| Hydraulischer Rettungssatz | **nicht vorhanden** (erst HLF 20) | WP |
| Steckleiter (4-teilig) | Pflicht (alt.: Multifunktionsleiter) | WP |
| Pressluftatmer | 4 | WP (LF-Basis) |
| Fluchthaube | 2 | WP (LF-Basis) |
| Tauchpumpe | TP 4 | WP (LF-Basis) |

> **App-relevanz:** die vier v1-Fächer der `LfSketch` (G1–G6, Dach,
> Mannschaftsraum, Fahrerkabine) sind eine *Darstellungs-* nicht DIN-Zuordnung.
> Für das Spiel zählt „Gerät ⇒ welches Fach", die konkrete Fach-Wahl darf die
> Feuerwehr im Editor selbst setzen (Beladung ist editierbar, DIN nur Startwert).

## Sources
- [de.wikipedia.org/wiki/Löschgruppenfahrzeug](https://de.wikipedia.org/wiki/Löschgruppenfahrzeug) (LF 20 section, gesichtet 2026-05-20)
- Primärquellen (nicht maschinell auslesbar): [LSTE Brandenburg — LF 20 Leistungsbeschreibung 2024](https://lste.brandenburg.de/sixcms/media.php/9/LF%2020_Leistungsbeschreibung_mit%20Beladungsliste_2024.pdf), [Regierung MV — Beladungsliste LF 20](https://www.regierung-mv.de/static/Regierungsportal/Ministerium%20f%C3%BCr%20Inneres%20und%20Europa/Inhalte/Kommunales/Zukunftsf%C3%A4hige%20Feuerwehr/Dateien/Beladungsliste%20LF%2020.pdf)

## Changelog
| Date | Change |
|------|--------|
| 2026-07-24 | Initial LF-20 loadout, headline-verified vs Wikipedia + DIN 14530-11; quantities/Fächer best-effort pending a machine-readable Beladeliste. |
