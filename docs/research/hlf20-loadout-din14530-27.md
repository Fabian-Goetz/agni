# HLF 20 — Beladung nach DIN 14530-27 (verifizierter Stand)

Companion to [`hlf20-loadout-din14530-27.csv`](./hlf20-loadout-din14530-27.csv).
Second directed loadout after the [LF 20](./lf20-loadout-din14530.md). The HLF 20
(**H**ilfeleistungs-Löschgruppenfahrzeug) is äußerlich fast identisch zum LF 20,
unterscheidet sich aber durch die **umfangreiche Beladung für die Technische
Hilfeleistung**. Each line maps to a row in
[`geraete-katalog-v1.csv`](./geraete-katalog-v1.csv) via `geraet`.

## Verification scope (same limit as LF 20)

- **Verified (hoch):** headline spec + the HLF-specific TH package, cross-checked
  against the German Wikipedia *Hilfeleistungslöschgruppenfahrzeug* article and
  the DIN 14530-27 abstract.
- **Not verified line-by-line:** the primary Beladelisten (Brandenburg LSTE, SFS,
  Boppard etc.) are compressed/scanned PDFs, unreadable here. Individual
  **quantities** and **Fächer** are best-effort (`mittel`/`niedrig`).
- **Fach is not normed** — `typischer_geraeteraum` is seeding guidance only.

## Verified headline facts (DIN 14530-27)

| Merkmal | HLF 20 | vs LF 20 | Quelle |
|---|---|---|---|
| Besatzung | 0/1/8/9 (Gruppe) | gleich | WP |
| Feuerlöschkreiselpumpe | FPN 10-2000 (fest) | gleich | WP/DIN |
| Löschwasserbehälter | **1600 l** | kleiner (LF 20: 2000 l) | DIN-Abstract |
| Schaummittel | 120 l (6 × 20) | gleich | DIN-Abstract |
| Löschpulver | 12 kg (2 × 6) | gleich | DIN-Abstract |
| **Hydraulischer Rettungssatz** | **vorhanden** (Spreizer ≥ BS, Schere ≥ BC, Rettungszylinder) | **LF 20: nicht vorhanden** | WP/DIN-Abstract |
| Hebekissen (pneumatisch) | vorhanden | HLF-Zusatz | DIN-Abstract |
| Steckleiter (4-teilig) | Pflicht (alt. Multifunktionsleiter) | gleich | WP |
| Pressluftatmer / Fluchthaube | 4 / 2 | gleich | WP |

**Key delta vs LF 20:** the HLF 20 trades ~400 l water for the **technische
Hilfeleistung** package — hydraulischer Rettungssatz (Schere/Spreizer/Zylinder +
Aggregat), Hebekissen, Abstützsystem, Glasmanagement, Mehrzweckzug. In the CSV
those lines carry `HLF-Zusatz:` in `anmerkung`; everything else is shared with the
LF 20 base.

## Sources
- [de.wikipedia.org/wiki/Hilfeleistungslöschgruppenfahrzeug](https://de.wikipedia.org/wiki/Hilfeleistungslöschgruppenfahrzeug)
- [DIN 14530-27:2019 — HLF 20 (Abstract)](https://webstore.ansi.org/standards/din/din14530272019de)
- Primärquelle (nicht maschinell auslesbar): [LSTE Brandenburg — HLF 20 Leistungsbeschreibung 2024](https://lste.brandenburg.de/sixcms/media.php/9/HLF%2020_Leistungsbeschreibung_mit%20Beladungsliste_2024.pdf)

## Changelog
| Date | Change |
|------|--------|
| 2026-07-24 | Initial HLF-20 loadout, headline-verified vs Wikipedia + DIN 14530-27; TH package flagged `HLF-Zusatz`; quantities/Fächer best-effort pending a machine-readable Beladeliste. |
