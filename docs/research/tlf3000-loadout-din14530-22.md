# TLF 3000 — Beladung nach DIN 14530-22 (verifizierter Stand)

Companion to [`tlf3000-loadout-din14530-22.csv`](./tlf3000-loadout-din14530-22.csv).
Das Tanklöschfahrzeug 3000 ist ein **Wasserträger mit Brandbekämpfungs-Fokus**:
großer Tank, kleine Besatzung (**Trupp**), wenig technische Hilfeleistung. Each
line maps to a row in [`geraete-katalog-v1.csv`](./geraete-katalog-v1.csv).

## Verification scope

Headline-verified against the German Wikipedia *Tanklöschfahrzeug* article + DIN
14530-22; per-item **quantities/Fächer are best-effort** (primary Beladelisten
unreadable). Fach is not DIN-normed. TLF haben zudem baubedingt **weniger
Geräteräume** als ein LF — `typischer_geraeteraum` ist reine Seeding-Hilfe.

## Verified headline facts (DIN 14530-22)

| Merkmal | TLF 3000 | vs LF 20 | Quelle |
|---|---|---|---|
| Besatzung | **0/1/2/3 (Trupp)** | kleiner (LF: Gruppe) | WP |
| Feuerlöschkreiselpumpe | FPN 10-2000 (fest) | gleich | WP |
| Löschwasser | **3000 l** | größer (LF: 2000 l) | WP |
| Schaummittel | 6 × 20 l | gleich | WP |
| Löschpulver | 2 × 6 kg | gleich | WP |
| Hydraulischer Rettungssatz | **nicht vorhanden** | gleich (LF hat auch keinen) | WP |
| Antrieb | Allrad | — | WP |

**Charakter:** viel Wasser + Brandbekämpfung/Schaum, oft Allrad und
vegetationsbrandtauglich (Löschrucksack, Feuerpatsche, Motorsäge als optionale
Zusatzbeladung). Kaum Rettungs-/Leiter-/TH-Beladung.

## Sources
- [de.wikipedia.org/wiki/Tanklöschfahrzeug](https://de.wikipedia.org/wiki/Tanklöschfahrzeug) (TLF 3000 section)
- Primärquelle (nicht maschinell auslesbar): Leistungsbeschreibungen der Länder-Feuerwehrschulen

## Changelog
| Date | Change |
|------|--------|
| 2026-07-24 | Initial TLF-3000 loadout, headline-verified vs Wikipedia + DIN 14530-22; quantities/Fächer best-effort. |
