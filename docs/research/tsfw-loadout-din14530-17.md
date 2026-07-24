# TSF-W — Beladung nach DIN 14530-17 (verifizierter Stand)

Companion to [`tsfw-loadout-din14530-17.csv`](./tsfw-loadout-din14530-17.csv).
Das Tragkraftspritzenfahrzeug mit Wasser ist das **kleinste Löschfahrzeug** hier:
**Staffel**-Besatzung, **tragbare** Feuerlöschpumpe (Tragkraftspritze) statt fest
eingebauter Pumpe, kleiner Tank, Brandbekämpfungs-Grundbeladung für eine Gruppe.
Each line maps to a row in [`geraete-katalog-v1.csv`](./geraete-katalog-v1.csv).

## Verification scope

Headline-verified against the German Wikipedia *Tragkraftspritzenfahrzeug*
article + DIN 14530-17; per-item **quantities/Fächer best-effort**. Fach not
DIN-normed; TSF-W hat nur wenige, kleine Geräteräume.

## Verified headline facts (DIN 14530-17)

| Merkmal | TSF-W | Besonderheit | Quelle |
|---|---|---|---|
| Besatzung | **0/1/5/6 (Staffel)** | — | WP |
| Feuerlöschpumpe | **Tragkraftspritze PFPN 10-1000** | **keine fest eingebaute Pumpe** — die TS ist die Pumpe | WP |
| Löschwasser | **500–750 l** | kleiner Tank | WP |
| Löschpulver | 6 kg | — | WP |
| Hydraulischer Rettungssatz | nicht vorhanden | — | WP |
| Steckleiter | vierteilig (Pflicht) | seit Norm; früher 2-teilig | WP |
| Atemschutz | vorhanden (Pressluftatmer) | Anzahl variiert | WP |
| Zul. Gesamtmasse | 7500 kg | — | WP |

**Charakter:** Grundbeladung Brandbekämpfung + eigene Wasserversorgung über die
Tragkraftspritze. Manche TSF-W nähern sich in der Beladung einem LF 10; hier ist
die **Norm-Grundausstattung** abgebildet, nicht die erweiterten Sonderbauweisen.

## Sources
- [de.wikipedia.org/wiki/Tragkraftspritzenfahrzeug](https://de.wikipedia.org/wiki/Tragkraftspritzenfahrzeug) (TSF-W section)
- Primärquelle (nicht maschinell auslesbar): [SFS-R Mindestausrüstung](https://www.sfsr.de/) (nur als PDF/Scan)

## Changelog
| Date | Change |
|------|--------|
| 2026-07-24 | Initial TSF-W loadout, headline-verified vs Wikipedia + DIN 14530-17; note: portable Tragkraftspritze statt fester Pumpe; quantities/Fächer best-effort. |
